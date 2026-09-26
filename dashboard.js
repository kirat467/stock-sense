import { auth, db } from "./backend/firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
    collection,
    getDocs,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

import { getProducts } from "./backend/products.js";


/* =========================
   DASHBOARD ELEMENTS
========================= */

const welcomeName = document.getElementById("welcomeName");
const sidebarName = document.getElementById("sidebarName");
const sidebarEmail = document.getElementById("sidebarEmail");
const sidebarAvatar = document.getElementById("sidebarAvatar");
const topName = document.getElementById("topName");
const topAvatar = document.getElementById("topAvatar");
const logoutBtn = document.getElementById("logoutBtn");

const totalProductsElement =
    document.getElementById("dashboardTotalProducts");

const lowStockElement =
    document.getElementById("dashboardLowStock");

const pendingReceiptsElement =
    document.getElementById("dashboardPendingReceipts");

const pendingDeliveriesElement =
    document.getElementById("dashboardPendingDeliveries");

const productChangeElement =
    document.getElementById("dashboardProductChange");

const lowStockFooter =
    document.getElementById("dashboardLowStockFooter");

const receiptsFooter =
    document.getElementById("dashboardReceiptsFooter");

const deliveriesFooter =
    document.getElementById("dashboardDeliveriesFooter");


/* =========================
   AUTHENTICATION
========================= */

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        console.log("No Firebase user currently signed in.");
        return;
    }

    console.log("Dashboard user:", user.email);

    const name = user.displayName || "User";
    const email = user.email || "";

    if (welcomeName) {
        welcomeName.textContent = name.split(" ")[0];
    }

    if (sidebarName) {
        sidebarName.textContent = name;
    }

    if (sidebarEmail) {
        sidebarEmail.textContent = email;
    }

    if (topName) {
        topName.textContent = name;
    }

    const firstLetter =
        name.charAt(0).toUpperCase();

    if (sidebarAvatar) {
        sidebarAvatar.textContent = firstLetter;
    }

    if (topAvatar) {
        topAvatar.textContent = firstLetter;
    }

    await loadDashboardData();
});


/* =========================
   MAIN DASHBOARD LOADER
========================= */

async function loadDashboardData() {

    try {

        console.log("Loading dashboard data...");

        const products = await getProducts();

        console.log("Products received:", products);


        /* =========================
           TOTAL PRODUCTS
        ========================= */

        const totalProducts = products.length;

        totalProductsElement.textContent =
            totalProducts;


        /* =========================
           LOW STOCK
        ========================= */

        const lowStockProducts =
            products.filter(product => {

                const stock =
                    Number(product.stock) || 0;

                const threshold =
                    Number(product.lowStockThreshold) || 5;

                return stock <= threshold;

            });

        const lowStockCount =
            lowStockProducts.length;

        lowStockElement.textContent =
            lowStockCount;

        lowStockFooter.innerHTML =
            `<span>${lowStockCount} item${lowStockCount === 1 ? "" : "s"} need attention</span>`;


        /* =========================
           PRODUCT GROWTH
        ========================= */

        updateProductGrowth(products);


        /* =========================
           PENDING OPERATIONS
        ========================= */

        await loadPendingOperations();


        /* =========================
           LOW STOCK ALERTS
        ========================= */

        loadLowStockAlerts(products);


        /* =========================
           STOCK MOVEMENT GRAPH
        ========================= */

        await loadStockChart();


        /* =========================
           RECENT MOVEMENTS
        ========================= */

        await loadRecentMovements();


        console.log("Dashboard updated successfully.");

    }

    catch (error) {

        console.error(
            "🔥 Dashboard data error:",
            error
        );

    }

}


/* =========================
   PRODUCT GROWTH
========================= */

function updateProductGrowth(products) {

    const now = new Date();

    const currentMonth =
        now.getMonth();

    const currentYear =
        now.getFullYear();


    const previousMonthDate =
        new Date(
            currentYear,
            currentMonth - 1,
            1
        );

    const previousMonth =
        previousMonthDate.getMonth();

    const previousMonthYear =
        previousMonthDate.getFullYear();


    const lastMonthTotal =
        products.filter(product => {

            if (!product.createdAt) {
                return false;
            }

            const date =
                product.createdAt.toDate
                    ? product.createdAt.toDate()
                    : new Date(product.createdAt);

            return (
                date <
                new Date(
                    currentYear,
                    currentMonth,
                    1
                )
            );

        }).length;


    if (lastMonthTotal === 0) {

        productChangeElement.innerHTML =
            `<span>New inventory data</span>`;

        return;

    }


    const percentage =
        (
            (products.length - lastMonthTotal)
            / lastMonthTotal
        ) * 100;


    const rounded =
        Math.abs(percentage).toFixed(1);


    if (percentage >= 0) {

        productChangeElement.innerHTML =
            `↑ ${rounded}% <span>from last month</span>`;

    } else {

        productChangeElement.innerHTML =
            `↓ ${rounded}% <span>from last month</span>`;

    }

}


/* =========================
   PENDING RECEIPTS / DELIVERIES
========================= */

async function loadPendingOperations() {

    try {

        const receiptSnapshot =
            await getDocs(
                collection(db, "receipts")
            );

        const deliverySnapshot =
            await getDocs(
                collection(db, "deliveries")
            );


        const pendingStatuses = [
            "Pending",
            "pending",
            "Waiting",
            "waiting",
            "Ready",
            "ready"
        ];


        const pendingReceipts =
            receiptSnapshot.docs.filter(doc => {

                const data = doc.data();

                return pendingStatuses.includes(
                    data.status
                );

            });


        const pendingDeliveries =
            deliverySnapshot.docs.filter(doc => {

                const data = doc.data();

                return pendingStatuses.includes(
                    data.status
                );

            });


        pendingReceiptsElement.textContent =
            pendingReceipts.length;

        pendingDeliveriesElement.textContent =
            pendingDeliveries.length;


        receiptsFooter.innerHTML =
            pendingReceipts.length === 0
                ? `<span>No pending receipts</span>`
                : `<span>${pendingReceipts.length} waiting for processing</span>`;


        deliveriesFooter.innerHTML =
            pendingDeliveries.length === 0
                ? `<span>No pending deliveries</span>`
                : `<span>${pendingDeliveries.length} waiting to ship</span>`;

    }

    catch (error) {

        console.error(
            "Pending operations error:",
            error
        );

        pendingReceiptsElement.textContent = "0";
        pendingDeliveriesElement.textContent = "0";

    }

}


/* =========================
   LOW STOCK ALERTS
========================= */

function loadLowStockAlerts(products) {

    const container =
        document.querySelector(".alerts-list") ||
        document.querySelector(".product-list");


    if (!container) {
        return;
    }


    const lowStockProducts =
        products.filter(product => {

            const stock =
                Number(product.stock) || 0;

            const threshold =
                Number(product.lowStockThreshold) || 5;

            return stock <= threshold;

        });


    if (lowStockProducts.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                <strong>All products are sufficiently stocked</strong>
                <span>No immediate stock alerts</span>
            </div>
        `;

        return;

    }


    container.innerHTML =
        lowStockProducts.map(product => {

            const stock =
                Number(product.stock) || 0;

            const threshold =
                Number(product.lowStockThreshold) || 5;

            const isOut =
                stock === 0;

            const initials =
                product.name
                    .split(" ")
                    .map(word => word[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase();


            return `
                <div class="product-row">

                    <div class="product-symbol red-bg">
                        ${initials}
                    </div>

                    <div class="product-info">
                        <strong>${product.name}</strong>
                        <span>${product.sku}</span>
                    </div>

                    <div class="stock-number ${isOut ? "danger" : "warning"}">
                        ${stock}
                        <small>
                            ${isOut ? "out" : "left"}
                        </small>
                    </div>

                </div>
            `;

        }).join("");

}


/* =========================
   STOCK CHART
========================= */

async function loadStockChart() {

    try {

        const snapshot =
            await getDocs(
                query(
                    collection(db, "stockLedger"),
                    orderBy("createdAt", "asc")
                )
            );


        const movements =
            snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));


        const today =
            new Date();

        today.setHours(0, 0, 0, 0);


        const days = [];


        for (let i = 6; i >= 0; i--) {

            const date =
                new Date(today);

            date.setDate(
                today.getDate() - i
            );

            days.push(date);

        }


        const incoming =
            days.map(day =>
                getDailyMovement(
                    movements,
                    day,
                    "IN"
                )
            );


        const outgoing =
            days.map(day =>
                getDailyMovement(
                    movements,
                    day,
                    "OUT"
                )
            );


        updateChartDays(days);

        drawChart(
            incoming,
            outgoing
        );

    }

    catch (error) {

        console.error(
            "Stock chart error:",
            error
        );

    }

}


/* =========================
   DAILY MOVEMENT
========================= */

function getDailyMovement(
    movements,
    targetDate,
    type
) {

    return movements.reduce(
        (total, movement) => {

            if (movement.type !== type) {
                return total;
            }

            if (!movement.createdAt) {
                return total;
            }

            const date =
                movement.createdAt.toDate
                    ? movement.createdAt.toDate()
                    : new Date(movement.createdAt);


            if (
                date.getFullYear() ===
                    targetDate.getFullYear() &&

                date.getMonth() ===
                    targetDate.getMonth() &&

                date.getDate() ===
                    targetDate.getDate()
            ) {

                return total +
                    (Number(movement.quantity) || 0);

            }

            return total;

        },
        0
    );

}


/* =========================
   CHART DAY LABELS
========================= */

function updateChartDays(days) {

    const container =
        document.getElementById("chartDays");

    if (!container) {
        return;
    }


    container.innerHTML =
        days.map(day => {

            return `
                <span>
                    ${day.toLocaleDateString(
                        "en-US",
                        { weekday: "short" }
                    )}
                </span>
            `;

        }).join("");

}


/* =========================
   DRAW SVG CHART
========================= */

function drawChart(
    incoming,
    outgoing
) {

    const incomingLine =
        document.getElementById(
            "incomingLine"
        );

    const outgoingLine =
        document.getElementById(
            "outgoingLine"
        );

    const incomingArea =
        document.getElementById(
            "incomingArea"
        );


    if (
        !incomingLine ||
        !outgoingLine ||
        !incomingArea
    ) {
        return;
    }


    const width = 700;
    const height = 260;
    const padding = 5;


    const maximum =
        Math.max(
            ...incoming,
            ...outgoing,
            1
        );


    const points =
        values => values.map(
            (value, index) => {

                const x =
                    index *
                    (width / 6);

                const y =
                    height -
                    (
                        value / maximum
                    ) *
                    (height - 20);

                return [x, y];

            }
        );


    const incomingPoints =
        points(incoming);

    const outgoingPoints =
        points(outgoing);


    const makePath =
        pointsArray => {

            return pointsArray
                .map(
                    ([x, y], index) =>
                        `${index === 0 ? "M" : "L"}${x} ${y}`
                )
                .join(" ");

        };


    const incomingPath =
        makePath(incomingPoints);

    const outgoingPath =
        makePath(outgoingPoints);


    incomingLine.setAttribute(
        "d",
        incomingPath
    );


    outgoingLine.setAttribute(
        "d",
        outgoingPath
    );


    incomingArea.setAttribute(
        "d",
        `${incomingPath} L700 260 L0 260 Z`
    );

}


/* =========================
   RECENT MOVEMENTS
========================= */

async function loadRecentMovements() {

    try {

        const container =
            document.querySelector(
                ".movement-table"
            );


        if (!container) {
            return;
        }


        const snapshot =
            await getDocs(
                query(
                    collection(db, "stockLedger"),
                    orderBy("createdAt", "desc")
                )
            );


        const movements =
            snapshot.docs
                .slice(0, 5)
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));


        const products =
            await getProducts();


        const productMap =
            new Map(
                products.map(product =>
                    [product.id, product]
                )
            );


        const rows =
            movements.map(movement => {

                const product =
                    productMap.get(
                        movement.productId
                    );


                const productName =
                    product?.name ||
                    "Unknown Product";


                let location = "—";

                if (
                    movement.fromLocation &&
                    movement.toLocation
                ) {

                    location =
                        `${movement.fromLocation} → ${movement.toLocation}`;

                }


                const time =
                    movement.createdAt?.toDate
                        ? movement.createdAt
                            .toDate()
                            .toLocaleTimeString(
                                [],
                                {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                }
                            )
                        : "—";


                let type =
                    movement.type || "Movement";


                if (type === "IN") {
                    type = "Receipt";
                }

                if (type === "OUT") {
                    type = "Delivery";
                }


                return `
                    <div class="table-row">

                        <strong>
                            ${productName}
                        </strong>

                        <span class="badge">
                            ${type}
                        </span>

                        <span>
                            ${movement.quantity ?? 0}
                        </span>

                        <span>
                            ${location}
                        </span>

                        <span>
                            ${time}
                        </span>

                    </div>
                `;

            }).join("");


        const header =
            container.querySelector(
                ".table-head"
            );


        container.innerHTML =
            header
                ? header.outerHTML + rows
                : rows;

    }

    catch (error) {

        console.error(
            "Recent movements error:",
            error
        );

    }

}


/* =========================
   LOGOUT
========================= */

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            try {

                await signOut(auth);

                window.location.href =
                    "index.html";

            }

            catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

                alert(
                    "Unable to logout. Please try again."
                );

            }

        }
    );

}
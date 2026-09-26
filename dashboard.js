import { auth, db } from "./backend/firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import { getProducts } from "./backend/products.js";

import {
    collection,
    getDocs,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const welcomeName = document.getElementById("welcomeName");
const sidebarName = document.getElementById("sidebarName");
const sidebarEmail = document.getElementById("sidebarEmail");
const sidebarAvatar = document.getElementById("sidebarAvatar");
const topName = document.getElementById("topName");
const topAvatar = document.getElementById("topAvatar");
const logoutBtn = document.getElementById("logoutBtn");

const totalProductsElement = document.getElementById("dashboardTotalProducts");
const lowStockElement = document.getElementById("dashboardLowStock");
const pendingReceiptsElement = document.getElementById("dashboardPendingReceipts");
const pendingDeliveriesElement = document.getElementById("dashboardPendingDeliveries");


/*
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "index.html";
        return;
    }

    const name = user.displayName || "User";
    const email = user.email || "";

    welcomeName.textContent = name.split(" ")[0];

    sidebarName.textContent = name;
    sidebarEmail.textContent = email;

    topName.textContent = name;

    const firstLetter = name.charAt(0).toUpperCase();
    sidebarAvatar.textContent = firstLetter;
    topAvatar.textContent = firstLetter;
});
*/

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        console.log("No Firebase user currently signed in.");
        return;
    }

    console.log("Dashboard user:", user.email);

    await loadDashboardData();
});

async function loadDashboardData() {
    try {
        console.log("Loading products from Firestore...");

        const products = await getProducts();

        console.log("Products received:", products);

        // Total number of products
        totalProductsElement.textContent = products.length;

        // Products that are low stock or out of stock
        const lowStockProducts = products.filter(product => {
            const stock = Number(product.stock) || 0;
            const threshold = Number(product.lowStockThreshold) || 5;

            return stock <= threshold;
        });

        lowStockElement.textContent = lowStockProducts.length;

        // Receipts and deliveries will be connected later
        pendingReceiptsElement.textContent = "0";
        pendingDeliveriesElement.textContent = "0";

        await loadLowStockAlerts(products);
        await loadRecentMovements();

        console.log("Dashboard updated successfully.");

    } catch (error) {
        console.error("🔥 Dashboard data error:", error);
    }
}

async function loadLowStockAlerts(products) {

    const alertContainer = document.querySelector(".alerts-list");

    if (!alertContainer) {
        console.log("Low stock alert container not found.");
        return;
    }

    const lowStockProducts = products.filter(product => {
        const stock = Number(product.stock) || 0;
        const threshold = Number(product.lowStockThreshold) || 5;

        return stock <= threshold;
    });

    if (lowStockProducts.length === 0) {

        alertContainer.innerHTML = `
            <div class="product-row">
                <div class="product-info">
                    <strong>All products are sufficiently stocked</strong>
                    <span>No immediate stock alerts</span>
                </div>
            </div>
        `;

        return;
    }

    alertContainer.innerHTML = "";

    lowStockProducts.forEach(product => {

        const stock = Number(product.stock) || 0;

        const initials = product.name
            .split(" ")
            .map(word => word[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();

        const severity =
            stock === 0 ? "danger" : "warning";

        const row = document.createElement("div");

        row.className = "product-row";

        row.innerHTML = `
            <div class="product-symbol ${severity === "danger" ? "red-bg" : "orange-bg"}">
                ${initials}
            </div>

            <div class="product-info">
                <strong>${product.name}</strong>
                <span>${product.sku}</span>
            </div>

            <div class="stock-number ${severity}">
                ${stock}
                <small>left</small>
            </div>
        `;

        alertContainer.appendChild(row);
    });
}


async function loadRecentMovements() {

    const movementTable =
        document.querySelector(".movement-table");

    if (!movementTable) {
        console.log("Movement table not found.");
        return;
    }

    try {

        const movementQuery = query(
            collection(db, "stockLedger"),
            orderBy("createdAt", "desc")
        );

        const snapshot =
            await getDocs(movementQuery);

        const movements = [];

        snapshot.forEach(doc => {
            movements.push({
                id: doc.id,
                ...doc.data()
            });
        });

        if (movements.length === 0) {
            return;
        }

        movementTable.innerHTML = `
            <div class="table-head">
                <span>Product</span>
                <span>Type</span>
                <span>Quantity</span>
                <span>Location</span>
                <span>Time</span>
            </div>
        `;

        const products = await getProducts();

        const productMap = {};

        products.forEach(product => {
            productMap[product.id] = product;
        });

        movements.slice(0, 5).forEach(movement => {

            const product =
                productMap[movement.productId];

            const productName =
                product ? product.name : "Unknown Product";

            let type = "Adjustment";

            if (movement.type === "IN") {
                type = "Receipt";
            } else if (movement.type === "OUT") {
                type = "Delivery";
            } else if (movement.type === "TRANSFER") {
                type = "Transfer";
            }

            let quantity = movement.quantity;

            if (movement.type === "IN") {
                quantity = `+${quantity}`;
            } else if (movement.type === "OUT") {
                quantity = `-${quantity}`;
            }

            let location = "Main Warehouse";

            if (movement.type === "TRANSFER") {
                location =
                    `${movement.fromLocation} → ${movement.toLocation}`;
            }

            let time = "Recently";

            if (movement.createdAt) {

                const date =
                    movement.createdAt.toDate();

                time =
                    date.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                    });
            }

            const row =
                document.createElement("div");

            row.className = "table-row";

            row.innerHTML = `
                <strong>${productName}</strong>

                <span class="badge">
                    ${type}
                </span>

                <span class="quantity ${
                    movement.type === "IN"
                        ? "positive"
                        : movement.type === "OUT"
                            ? "negative"
                            : "neutral"
                }">
                    ${quantity}
                </span>

                <span>${location}</span>

                <span>${time}</span>
            `;

            movementTable.appendChild(row);
        });

    } catch (error) {

        console.error(
            "Recent movements error:",
            error
        );
    }
}

logoutBtn.addEventListener("click", async () => {
    try {
        await signOut(auth);
        window.location.href = "index.html";
    } catch (error) {
        console.error("Logout error:", error);
        alert("Unable to logout. Please try again.");
    }
});
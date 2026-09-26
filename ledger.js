import { db, auth } from "./backend/firebase.js";

import {
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

import { getProducts } from "./backend/products.js";

const ledgerContainer =
    document.getElementById("ledgerContainer");

const backBtn =
    document.getElementById("backBtn");

async function loadLedger() {

    try {

        const products = await getProducts();

        const productMap = {};

        products.forEach(product => {
            productMap[product.id] = product;
        });

        const ledgerQuery = query(
            collection(db, "stockLedger"),
            where("ownerId", "==", auth.currentUser.uid)
        );

        const snapshot = await getDocs(ledgerQuery);

        if (snapshot.empty) {

            ledgerContainer.innerHTML = `
                <p class="empty">
                    No stock movements yet.
                </p>
            `;

            return;
        }

        ledgerContainer.innerHTML = "";

        snapshot.forEach(documentSnapshot => {

            const movement = documentSnapshot.data();

            const product =
                productMap[movement.productId];

            const productName =
                product ? product.name : "Unknown Product";

            const isIncoming =
                movement.type === "IN";

            const row =
                document.createElement("div");

            row.className = "ledger-row";

            row.innerHTML = `
                <strong>${productName}</strong>

                <span class="${isIncoming ? "type-in" : "type-out"}">
                    ${isIncoming ? "Receipt" : "Delivery"}
                </span>

                <span class="${isIncoming ? "quantity-in" : "quantity-out"}">
                    ${isIncoming ? "+" : "-"}${movement.quantity}
                </span>

                <span>
                    ${movement.previousStock}
                </span>

                <span>
                    ${movement.newStock}
                </span>

                <span>
                    ${movement.reason || "-"}
                </span>
            `;

            ledgerContainer.appendChild(row);

        });

    } catch (error) {

        console.error("Ledger error:", error);

        ledgerContainer.innerHTML = `
            <p class="empty">
                Unable to load stock movements.
            </p>
        `;
    }
}

backBtn.addEventListener("click", () => {
    window.location.href = "dashboard.html";
});

loadLedger();
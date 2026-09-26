import { db, auth } from "./backend/firebase.js";

import {
    addDoc,
    collection,
    doc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

import { getProducts } from "./backend/products.js";

const productSelect = document.getElementById("product");
const transferForm = document.getElementById("transferForm");
const backBtn = document.getElementById("backBtn");


// ===============================
// LOAD PRODUCTS
// ===============================

async function loadProducts() {

    try {

        const products = await getProducts();

        productSelect.innerHTML =
            '<option value="">Select Product</option>';

        products.forEach(product => {

            const option = document.createElement("option");

            option.value = product.id;
            option.textContent =
                `${product.name} (${product.sku})`;

            productSelect.appendChild(option);
        });

    } catch (error) {

        console.error("Error loading products:", error);
        alert(error.message);
    }
}


// ===============================
// TRANSFER STOCK
// ===============================

transferForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const productId =
        document.getElementById("product").value;

    const quantity =
        Number(document.getElementById("quantity").value);

    const fromLocation =
        document.getElementById("fromLocation").value;

    const toLocation =
        document.getElementById("toLocation").value;


    if (!productId) {
        alert("Please select a product.");
        return;
    }

    if (!quantity || quantity <= 0) {
        alert("Please enter a valid quantity.");
        return;
    }

    if (fromLocation === toLocation) {
        alert("Source and destination cannot be the same.");
        return;
    }


    try {

        const user = auth.currentUser;

        if (!user) {
            throw new Error("User is not logged in.");
        }


        // Get ONLY current user's products
        const products = await getProducts();

        const product =
            products.find(product => product.id === productId);


        if (!product) {
            throw new Error(
                "Product not found or you do not have access to it."
            );
        }


        const productRef =
            doc(db, "products", productId);


        const warehouses = product.warehouses || {
            "Main Warehouse": 0,
            "Warehouse 1": 0,
            "Warehouse 2": 0,
            "Production Rack": 0
        };


        const sourceStock =
            Number(warehouses[fromLocation]) || 0;


        if (quantity > sourceStock) {

            alert(
                `Not enough stock in ${fromLocation}. Available: ${sourceStock}`
            );

            return;
        }


        // Remove from source
        warehouses[fromLocation] =
            sourceStock - quantity;


        // Add to destination
        warehouses[toLocation] =
            (Number(warehouses[toLocation]) || 0) + quantity;


        // Update product warehouses
        await updateDoc(productRef, {
            warehouses: warehouses
        });


        // Record transfer in ledger
        await addDoc(
            collection(db, "stockLedger"),
            {
                productId: productId,
                ownerId: user.uid,
                type: "TRANSFER",
                quantity: quantity,
                fromLocation: fromLocation,
                toLocation: toLocation,
                reason:
                    `Transfer from ${fromLocation} to ${toLocation}`,
                createdAt: serverTimestamp()
            }
        );


        showToast(
            `${quantity} moved from ${fromLocation} to ${toLocation}.`,
            "Transfer Completed"
        );


        transferForm.reset();

        await loadProducts();


    } catch (error) {

        console.error("Transfer error:", error);

        alert(error.message);
    }

});


// ===============================
// BACK BUTTON
// ===============================

backBtn.addEventListener("click", () => {

    window.location.href = "dashboard.html";

});


// ===============================
// INITIAL LOAD
// ===============================

loadProducts();
import { db } from "./backend/firebase.js";

import {
    doc,
    getDoc,
    updateDoc,
    addDoc,
    collection,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

import { getProducts } from "./backend/products.js";

const productSelect =
    document.getElementById("productSelect");

const adjustmentForm =
    document.getElementById("adjustmentForm");

const backBtn =
    document.getElementById("backBtn");


async function loadProducts() {

    try {

        const products = await getProducts();

        productSelect.innerHTML =
            '<option value="">Select Product</option>';

        products.forEach(product => {

            const option = document.createElement("option");

            option.value = product.id;

            option.textContent =
                `${product.name} (${product.sku}) - Current: ${product.stock}`;

            productSelect.appendChild(option);

        });

    } catch (error) {

        console.error("Product loading error:", error);

        alert("Unable to load products.");
    }
}


adjustmentForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const productId =
        productSelect.value;

    const actualStock =
        Number(document.getElementById("actualStock").value);

    const reason =
        document.getElementById("reason").value;


    if (!productId || actualStock < 0) {

        alert("Please select a product and enter valid stock.");

        return;
    }


    try {

        const productRef =
            doc(db, "products", productId);

        const productSnapshot =
            await getDoc(productRef);


        if (!productSnapshot.exists()) {

            throw new Error("Product not found.");
        }


        const product =
            productSnapshot.data();

        const previousStock =
            Number(product.stock) || 0;


        const difference =
            actualStock - previousStock;


        if (difference === 0) {

           showToast(
                "Stock is already correct. No adjustment was needed.",
                "No Adjustment"
            );

            return;
        }


        await updateDoc(productRef, {
            stock: actualStock
        });


        await addDoc(
            collection(db, "stockLedger"),
            {
                productId: productId,
                type: "ADJUSTMENT",
                quantity: Math.abs(difference),
                previousStock: previousStock,
                newStock: actualStock,
                reason: reason,
                createdAt: serverTimestamp()
            }
        );


            showToast(
                `Previous stock: ${previousStock} → New stock: ${actualStock}`,
                "Inventory Adjusted"
            );


        adjustmentForm.reset();

        await loadProducts();

    } catch (error) {

        console.error("Adjustment error:", error);

        alert(
            "Unable to apply adjustment.\n\n" +
            error.message
        );
    }

});


backBtn.addEventListener("click", () => {

    window.location.href = "dashboard.html";

});


loadProducts();
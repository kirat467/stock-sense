import { db } from "./backend/firebase.js";

import {
    collection,
    getDocs,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

import { getProducts } from "./backend/products.js";

const productSelect =
    document.getElementById("productSelect");

const transferForm =
    document.getElementById("transferForm");

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
                `${product.name} (${product.sku}) - Stock: ${product.stock}`;

            productSelect.appendChild(option);

        });

    } catch (error) {

        console.error("Product loading error:", error);

        alert("Unable to load products.");
    }
}


transferForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const productId =
        productSelect.value;

    const quantity =
        Number(document.getElementById("quantity").value);

    const fromLocation =
        document.getElementById("fromLocation").value;

    const toLocation =
        document.getElementById("toLocation").value;


    if (!productId || quantity <= 0) {

        alert("Please select a product and valid quantity.");

        return;
    }


    if (fromLocation === toLocation) {

        alert("Source and destination must be different.");

        return;
    }


    try {

        await addDoc(
            collection(db, "stockLedger"),
            {
                productId: productId,

                type: "TRANSFER",

                quantity: quantity,

                fromLocation: fromLocation,

                toLocation: toLocation,

                reason:
                    `Transfer from ${fromLocation} to ${toLocation}`,

                createdAt: serverTimestamp()
            }
        );


        alert("Stock transfer recorded successfully!");

        transferForm.reset();

    } catch (error) {

        console.error("Transfer error:", error);

        alert(
            "Unable to record transfer.\n\n" +
            error.message
        );
    }

});


backBtn.addEventListener("click", () => {

    window.location.href = "dashboard.html";

});


loadProducts();
import { db } from "./backend/firebase.js";

import {
    collection,
    getDocs,
    addDoc,
    doc,
    updateDoc,
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

            const option =
                document.createElement("option");

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
        Number(
            document.getElementById("quantity").value
        );

    const fromLocation =
        document.getElementById("fromLocation").value;

    const toLocation =
        document.getElementById("toLocation").value;


    if (!productId || quantity <= 0) {

        alert(
            "Please select a product and valid quantity."
        );

        return;
    }


    if (fromLocation === toLocation) {

        alert(
            "Source and destination must be different."
        );

        return;
    }


    try {

        // Get product
        const productRef =
            doc(db, "products", productId);

        const productSnapshot =
            await getDocs(
                collection(db, "products")
            );

        const products =
            productSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

        const product =
            products.find(p => p.id === productId);


        if (!product) {

            alert("Product not found.");

            return;
        }


        // Existing warehouse data
        const warehouses =
            product.warehouses || {
                "Main Warehouse": 0,
                "Warehouse 1": 0,
                "Warehouse 2": 0,
                "Production Rack": 0
            };


        const sourceStock =
            Number(warehouses[fromLocation]) || 0;


        // Check source warehouse stock
        if (quantity > sourceStock) {

            alert(
                `Not enough stock in ${fromLocation}.\n\n` +
                `Available: ${sourceStock}\n` +
                `Requested: ${quantity}`
            );

            return;
        }


        // Move stock
        warehouses[fromLocation] =
            sourceStock - quantity;

        warehouses[toLocation] =
            (Number(warehouses[toLocation]) || 0)
            + quantity;


        // Update product
        await updateDoc(
            productRef,
            {
                warehouses: warehouses
            }
        );


        // Record transfer in ledger
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


        alert(
            `Transfer successful!\n\n` +
            `${quantity} moved from ${fromLocation} to ${toLocation}.`
        );

        transferForm.reset();

        await loadProducts();


    } catch (error) {

        console.error(
            "Transfer error:",
            error
        );

        alert(
            "Unable to record transfer.\n\n" +
            error.message
        );

    }

});


backBtn.addEventListener("click", () => {

    window.location.href =
        "dashboard.html";

});


loadProducts();
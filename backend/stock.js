// backend/stock.js

import { db } from "./firebase.js";

import {
    doc,
    getDoc,
    updateDoc,
    addDoc,
    collection,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


// ===============================
// ADD STOCK
// ===============================

async function addStock(productId, quantity, reason = "Receipt") {

    const productRef =
        doc(db, "products", productId);

    const productSnapshot =
        await getDoc(productRef);


    if (!productSnapshot.exists()) {

        throw new Error("Product not found.");

    }


    const product =
        productSnapshot.data();


    const oldStock =
        Number(product.stock) || 0;


    const newStock =
        oldStock + Number(quantity);


    await updateDoc(
        productRef,
        {
            stock: newStock
        }
    );


    // Log movement
    await addDoc(
        collection(db, "stockLedger"),
        {
            productId: productId,
            type: "IN",
            quantity: Number(quantity),
            reason: reason,
            previousStock: oldStock,
            newStock: newStock,
            createdAt: serverTimestamp()
        }
    );


    return newStock;
}


// ===============================
// REMOVE STOCK
// ===============================

async function removeStock(productId, quantity, reason = "Delivery") {

    const productRef =
        doc(db, "products", productId);

    const productSnapshot =
        await getDoc(productRef);


    if (!productSnapshot.exists()) {

        throw new Error("Product not found.");

    }


    const product =
        productSnapshot.data();


    const oldStock =
        Number(product.stock) || 0;


    const amount =
        Number(quantity);


    if (amount > oldStock) {

        throw new Error(
            `Not enough stock. Available: ${oldStock}`
        );

    }


    const newStock =
        oldStock - amount;


    await updateDoc(
        productRef,
        {
            stock: newStock
        }
    );


    // Log movement
    await addDoc(
        collection(db, "stockLedger"),
        {
            productId: productId,
            type: "OUT",
            quantity: amount,
            reason: reason,
            previousStock: oldStock,
            newStock: newStock,
            createdAt: serverTimestamp()
        }
    );


    return newStock;
}


export {
    addStock,
    removeStock
};
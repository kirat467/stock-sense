// backend/stock.js

import { db, auth } from "./firebase.js";

import {
    doc,
    getDoc,
    updateDoc,
    addDoc,
    collection,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


function getCurrentUser() {
    const user = auth.currentUser;

    if (!user) {
        throw new Error("User is not logged in.");
    }

    return user;
}


// ===============================
// ADD STOCK
// ===============================

async function addStock(productId, quantity, reason = "Receipt") {

    const user = getCurrentUser();

    const productRef = doc(db, "products", productId);
    const productSnapshot = await getDoc(productRef);

    if (!productSnapshot.exists()) {
        throw new Error("Product not found.");
    }

    const product = productSnapshot.data();

    if (product.ownerId !== user.uid) {
        throw new Error("You do not have access to this product.");
    }

    const oldStock = Number(product.stock) || 0;
    const amount = Number(quantity);
    const newStock = oldStock + amount;

    const warehouses = product.warehouses || {
        "Main Warehouse": 0,
        "Warehouse 1": 0,
        "Warehouse 2": 0,
        "Production Rack": 0
    };

    warehouses["Main Warehouse"] =
        (Number(warehouses["Main Warehouse"]) || 0) + amount;

    await updateDoc(productRef, {
        stock: newStock,
        warehouses: warehouses
    });

    await addDoc(collection(db, "stockLedger"), {
        productId: productId,
        ownerId: user.uid,
        type: "IN",
        quantity: amount,
        reason: reason,
        previousStock: oldStock,
        newStock: newStock,
        createdAt: serverTimestamp()
    });

    return newStock;
}


// ===============================
// REMOVE STOCK
// ===============================

async function removeStock(productId, quantity, reason = "Delivery") {

    const user = getCurrentUser();

    const productRef = doc(db, "products", productId);
    const productSnapshot = await getDoc(productRef);

    if (!productSnapshot.exists()) {
        throw new Error("Product not found.");
    }

    const product = productSnapshot.data();

    if (product.ownerId !== user.uid) {
        throw new Error("You do not have access to this product.");
    }

    const oldStock = Number(product.stock) || 0;
    const amount = Number(quantity);

    if (amount > oldStock) {
        throw new Error(`Not enough stock. Available: ${oldStock}`);
    }

    const warehouses = product.warehouses || {
        "Main Warehouse": 0,
        "Warehouse 1": 0,
        "Warehouse 2": 0,
        "Production Rack": 0
    };

    if (Number(warehouses["Main Warehouse"]) < amount) {
        throw new Error("Not enough stock in Main Warehouse.");
    }

    const newStock = oldStock - amount;

    warehouses["Main Warehouse"] =
        Number(warehouses["Main Warehouse"]) - amount;

    await updateDoc(productRef, {
        stock: newStock,
        warehouses: warehouses
    });

    await addDoc(collection(db, "stockLedger"), {
        productId: productId,
        ownerId: user.uid,
        type: "OUT",
        quantity: amount,
        reason: reason,
        previousStock: oldStock,
        newStock: newStock,
        createdAt: serverTimestamp()
    });

    return newStock;
}


export {
    addStock,
    removeStock
};
// backend/products.js

import { db, auth } from "./firebase.js";

import {
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    query,
    where,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


// GET CURRENT USER
async function getCurrentUser() {
    if (auth.currentUser) {
        return auth.currentUser;
    }

    return new Promise((resolve, reject) => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            unsubscribe();

            if (user) {
                resolve(user);
            } else {
                reject(new Error("User is not logged in."));
            }
        });
    });
}


// ===============================
// ADD PRODUCT
// ===============================

async function addProduct(product) {
    const user = await getCurrentUser();

    const initialStock = Number(product.stock) || 0;

    const productData = {
        name: product.name,
        sku: product.sku,
        category: product.category,
        unit: product.unit,
        stock: initialStock,
        lowStockThreshold: Number(product.lowStockThreshold) || 5,

        warehouses: {
            "Main Warehouse": initialStock,
            "Warehouse 1": 0,
            "Warehouse 2": 0,
            "Production Rack": 0
        },

        ownerId: user.uid,

        createdAt: serverTimestamp()
    };

    const productRef = await addDoc(
        collection(db, "products"),
        productData
    );

    return productRef.id;
}


// ===============================
// GET CURRENT USER'S PRODUCTS
// ===============================

async function getProducts() {
    const user = await getCurrentUser();

    const productsQuery = query(
        collection(db, "products"),
        where("ownerId", "==", user.uid)
    );

    const snapshot = await getDocs(productsQuery);

    return snapshot.docs.map(documentSnapshot => ({
        id: documentSnapshot.id,
        ...documentSnapshot.data()
    }));
}


// ===============================
// UPDATE PRODUCT
// ===============================

async function updateProduct(productId, data) {
    const user = await getCurrentUser();

    const productRef = doc(db, "products", productId);

    const snapshot = await getDocs(
        query(
            collection(db, "products"),
            where("ownerId", "==", user.uid)
        )
    );

    const ownsProduct = snapshot.docs.some(
        documentSnapshot => documentSnapshot.id === productId
    );

    if (!ownsProduct) {
        throw new Error("You do not have access to this product.");
    }

    await updateDoc(productRef, data);
}


// ===============================
// DELETE PRODUCT
// ===============================

async function deleteProduct(productId) {
    const user = await getCurrentUser();

    const productRef = doc(db, "products", productId);

    const snapshot = await getDocs(
        query(
            collection(db, "products"),
            where("ownerId", "==", user.uid)
        )
    );

    const ownsProduct = snapshot.docs.some(
        documentSnapshot => documentSnapshot.id === productId
    );

    if (!ownsProduct) {
        throw new Error("You do not have access to this product.");
    }

    await deleteDoc(productRef);
}


export {
    addProduct,
    getProducts,
    updateProduct,
    deleteProduct
};
// backend/products.js

import { db } from "./firebase.js";

import {
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


// ===============================
// ADD PRODUCT
// ===============================

async function addProduct(product) {

    const productData = {

        name: product.name,
        sku: product.sku,
        category: product.category,
        unit: product.unit,

        stock: Number(product.stock) || 0,

        lowStockThreshold:
            Number(product.lowStockThreshold) || 5,

        createdAt: serverTimestamp()
    };


    const productRef =
        await addDoc(
            collection(db, "products"),
            productData
        );


    return productRef.id;
}


// ===============================
// GET ALL PRODUCTS
// ===============================

async function getProducts() {

    const snapshot =
        await getDocs(
            collection(db, "products")
        );


    return snapshot.docs.map(doc => ({

        id: doc.id,
        ...doc.data()

    }));
}


// ===============================
// UPDATE PRODUCT
// ===============================

async function updateProduct(productId, data) {

    await updateDoc(
        doc(db, "products", productId),
        data
    );
}


// ===============================
// DELETE PRODUCT
// ===============================

async function deleteProduct(productId) {

    await deleteDoc(
        doc(db, "products", productId)
    );
}


export {
    addProduct,
    getProducts,
    updateProduct,
    deleteProduct
};
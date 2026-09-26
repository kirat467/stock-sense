import {
    addProduct,
    getProducts,
    updateProduct,
    deleteProduct
} from "./backend/products.js";

import { auth } from "./backend/firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("🔥 FIREBASE USER FOUND");
        console.log("User ID:", user.uid);
        console.log("Email:", user.email);
    } else {
        console.log("❌ NO FIREBASE USER");
    }
});

const addProductBtn = document.getElementById("addProductBtn");
const productModal = document.getElementById("productModal");
const closeModal = document.getElementById("closeModal");

const productForm = document.getElementById("productForm");

const productsTableBody =
    document.getElementById("productsTableBody");

const searchInput =
    document.getElementById("searchInput");

const categoryFilter =
    document.getElementById("categoryFilter");


let products = [];



/* =========================
   OPEN MODAL
========================= */

addProductBtn.addEventListener("click", () => {
    productModal.classList.remove("hidden");
});

/* =========================
   CLOSE MODAL
========================= */

closeModal.addEventListener("click", () => {
    productModal.classList.add("hidden");
});

/* =========================
   LOAD PRODUCTS
========================= */

async function loadProducts() {

    try {

        products = await getProducts();

        updateStatistics();

        updateCategoryFilter();

        displayProducts();

    } catch (error) {

        console.error("Error loading products:", error);

        productsTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty">
                    Unable to load products.
                </td>
            </tr>
        `;

    }

}



/* =========================
   ADD PRODUCT
========================= */

productForm.addEventListener("submit", async (event) => {

    event.preventDefault();


    const product = {

        name:
            document.getElementById("productName").value.trim(),

        sku:
            document.getElementById("productSKU").value.trim(),

        category:
            document.getElementById("productCategory").value.trim(),

        unit:
            document.getElementById("productUnit").value,

        stock:
            Number(document.getElementById("productStock").value),

        lowStockThreshold:
            Number(
                document.getElementById("lowStockThreshold").value
            )

    };

    try {

        const productId = await addProduct(product);


            showToast(
                "Product has been added successfully!",
                "Product Added"
            );

        productForm.reset();

        productModal.classList.add("hidden");

        await loadProducts();

    } catch (error) {

        console.error("🔥 ADD PRODUCT ERROR:", error);

        alert(
            "Unable to add product.\n\n" +
            error.code + "\n" +
            error.message
        );

    }

});



/* =========================
   DISPLAY PRODUCTS
========================= */

function displayProducts() {

    const search =
        searchInput.value.toLowerCase().trim();

    const selectedCategory =
        categoryFilter.value;


    const filteredProducts = products.filter(product => {

        const matchesSearch =
            product.name.toLowerCase().includes(search) ||
            product.sku.toLowerCase().includes(search);


        const matchesCategory =
            selectedCategory === "all" ||
            product.category === selectedCategory;


        return matchesSearch && matchesCategory;

    });


    if (filteredProducts.length === 0) {

        productsTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty">
                    No products found.
                </td>
            </tr>
        `;

        return;

    }


    productsTableBody.innerHTML =
        filteredProducts.map(product => {

            const stock =
                Number(product.stock) || 0;

            const threshold =
                Number(product.lowStockThreshold) || 5;


            let status;
            let statusClass;


            if (stock === 0) {

                status = "Out of Stock";
                statusClass = "out";

            } else if (stock <= threshold) {

                status = "Low Stock";
                statusClass = "low";

            } else {

                status = "In Stock";
                statusClass = "in";

            }


            return `
                <tr>

                    <td>
                        <strong>${product.name}</strong>
                    </td>

                    <td>${product.sku}</td>

                    <td>${product.category}</td>

                    <td>${product.unit}</td>

                    <td>${stock}</td>

                    <td>
                        <span class="status ${statusClass}">
                            ${status}
                        </span>
                    </td>

                    <td>

                        <button
                            class="action-btn"
                            onclick="editProduct('${product.id}')"
                        >
                            Edit
                        </button>

                        <button
                            class="action-btn"
                            onclick="removeProduct('${product.id}')"
                        >
                            Delete
                        </button>

                    </td>

                </tr>
            `;

        }).join("");

}



/* =========================
   STATISTICS
========================= */

function updateStatistics() {

    const total =
        products.length;


    const inStock =
        products.filter(product => {

            const stock = Number(product.stock) || 0;

            const threshold =
                Number(product.lowStockThreshold) || 5;

            return stock > threshold;

        }).length;


    const lowStock =
        products.filter(product => {

            const stock = Number(product.stock) || 0;

            const threshold =
                Number(product.lowStockThreshold) || 5;

            return stock > 0 && stock <= threshold;

        }).length;


    const outOfStock =
        products.filter(product => {

            return Number(product.stock) === 0;

        }).length;


    document.getElementById("totalProducts").textContent =
        total;

    document.getElementById("inStockProducts").textContent =
        inStock;

    document.getElementById("lowStockProducts").textContent =
        lowStock;

    document.getElementById("outStockProducts").textContent =
        outOfStock;

}



/* =========================
   CATEGORY FILTER
========================= */

function updateCategoryFilter() {

    const categories =
        [...new Set(
            products.map(product => product.category)
        )];


    categoryFilter.innerHTML =
        `<option value="all">All Categories</option>`;


    categories.forEach(category => {

        categoryFilter.innerHTML += `
            <option value="${category}">
                ${category}
            </option>
        `;

    });

}



/* =========================
   SEARCH
========================= */

searchInput.addEventListener(
    "input",
    displayProducts
);


categoryFilter.addEventListener(
    "change",
    displayProducts
);



/* =========================
   DELETE PRODUCT
========================= */

window.removeProduct = async function(productId) {

    const confirmDelete =
        confirm("Delete this product?");


    if (!confirmDelete) return;


    try {

        await deleteProduct(productId);

        showToast(
            "Product has been deleted successfully!",
            "Product Deleted"
        );

        await loadProducts();

    } catch (error) {

        console.error(
            "Error deleting product:",
            error
        );

        alert("Unable to delete product.");

    }

};



/* =========================
   EDIT PRODUCT
========================= */

window.editProduct = async function(productId) {

    const product =
        products.find(p => p.id === productId);


    if (!product) return;


    const newStock =
        prompt(
            `Enter new stock for ${product.name}:`,
            product.stock
        );


    if (newStock === null) return;


    const stock =
        Number(newStock);


    if (Number.isNaN(stock) || stock < 0) {

        alert("Please enter a valid stock number.");

        return;

    }


    try {

        await updateProduct(
            productId,
            {
                stock: stock
            }
        );
        showToast(
            "Product stock has been updated successfully!",
            "Product Updated"
        );

        await loadProducts();

    } catch (error) {

        console.error(
            "Error updating product:",
            error
        );

        alert("Unable to update product.");

    }

};



/* =========================
   START
========================= */

loadProducts();
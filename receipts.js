import { getProducts } from "./backend/products.js";
import { addStock } from "./backend/stock.js";

const productSelect = document.getElementById("productSelect");
const receiptForm = document.getElementById("receiptForm");
const backBtn = document.getElementById("backBtn");

async function loadProducts() {
    try {
        const products = await getProducts();

        products.forEach(product => {
            const option = document.createElement("option");

            option.value = product.id;
            option.textContent =
                `${product.name} (${product.sku}) - Stock: ${product.stock}`;

            productSelect.appendChild(option);
        });

    } catch (error) {
        console.error("Error loading products:", error);
        alert("Unable to load products.");
    }
}

receiptForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const productId = productSelect.value;
    const quantity = Number(document.getElementById("quantity").value);
    const supplier = document.getElementById("supplier").value;

    if (!productId || quantity <= 0) {
        alert("Please select a product and enter a valid quantity.");
        return;
    }

    try {
        await addStock(
            productId,
            quantity,
            `Receipt from ${supplier}`
        );

        alert("Receipt validated! Stock increased successfully.");

        receiptForm.reset();

        await loadProducts();

    } catch (error) {
        console.error("Receipt error:", error);
        alert("Unable to process receipt.\n" + error.message);
    }
});

backBtn.addEventListener("click", () => {
    window.location.href = "dashboard.html";
});

loadProducts();
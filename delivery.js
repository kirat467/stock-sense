import { getProducts } from "./backend/products.js";
import { removeStock } from "./backend/stock.js";

const productSelect = document.getElementById("productSelect");
const deliveryForm = document.getElementById("deliveryForm");
const backBtn = document.getElementById("backBtn");

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
        console.error("Error loading products:", error);
        alert("Unable to load products.");
    }
}

deliveryForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const productId = productSelect.value;
    const quantity =
        Number(document.getElementById("quantity").value);

    const destination =
        document.getElementById("destination").value;

    if (!productId || quantity <= 0) {
        alert("Please select a product and enter a valid quantity.");
        return;
    }

    try {

        await removeStock(
            productId,
            quantity,
            `Delivery to ${destination}`
        );

        showToast(
            "Stock decreased successfully.",
            "Delivery Validated"
        );

        deliveryForm.reset();

        await loadProducts();

    } catch (error) {

        console.error("Delivery error:", error);

        alert(
            "Unable to process delivery.\n\n" +
            error.message
        );
    }
});

backBtn.addEventListener("click", () => {
    window.location.href = "dashboard.html";
});

loadProducts();
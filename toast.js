function showToast(message, title = "Success") {

    const overlay = document.createElement("div");

    overlay.className = "toast-overlay";

    overlay.innerHTML = `
        <div class="toast-box">

            <div class="toast-icon">✓</div>

            <div class="toast-title">
                ${title}
            </div>

            <div class="toast-message">
                ${message}
            </div>

            <button class="toast-ok">
                OK
            </button>

        </div>
    `;

    document.body.appendChild(overlay);

    overlay
        .querySelector(".toast-ok")
        .addEventListener("click", () => {
            overlay.remove();
        });
}
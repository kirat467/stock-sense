import {
    signupUser,
    loginUser,
    resetPassword
} from "./backend/auth.js";


// ===============================
// GET ELEMENTS
// ===============================

const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");

const loginView = document.getElementById("loginView");
const signupView = document.getElementById("signupView");


// ===============================
// LOGIN / SIGNUP TABS
// ===============================

function showLogin() {

    loginTab.classList.add("active");
    signupTab.classList.remove("active");

    loginView.style.display = "block";
    signupView.style.display = "none";
}


function showSignup() {

    signupTab.classList.add("active");
    loginTab.classList.remove("active");

    signupView.style.display = "block";
    loginView.style.display = "none";
}


loginTab.onclick = showLogin;
signupTab.onclick = showSignup;


// ===============================
// LOGIN
// ===============================

document.getElementById("loginForm").addEventListener("submit", async (event) => {

    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    const loginNotice = document.getElementById("loginNotice");

    loginNotice.textContent = "Logging in...";
    loginNotice.className = "notice";

    const result = await loginUser(email, password);

    if (result.success) {

        loginNotice.textContent = "Login successful! Opening dashboard...";

        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 500);

    } else {

        loginNotice.textContent = result.error;
        loginNotice.className = "notice error";

    }

});


// ===============================
// SIGNUP
// ===============================

document.getElementById("signupForm").onsubmit = async function(event) {

    event.preventDefault();


    const name =
        document.getElementById("signupName").value.trim();

    const email =
        document.getElementById("signupEmail").value.trim();

    const password =
        document.getElementById("signupPassword").value;


    if (!name || !email || !password) {

        alert("Please fill in all fields.");

        return;
    }


    if (password.length < 6) {

        alert("Password must be at least 6 characters.");

        return;
    }


    // 🔥 REAL FIREBASE SIGNUP
    const result =
        await signupUser(
            name,
            email,
            password
        );


    if (result.success) {

        document.getElementById("signupNotice").textContent =
            "Account created successfully! 🎉";

        document.getElementById("signupNotice").style.display =
            "block";


        console.log("Created user:", result.user);

    } else {

        document.getElementById("signupNotice").textContent =
            result.error;

        document.getElementById("signupNotice").style.display =
            "block";
    }
};


// ===============================
// PASSWORD RESET MODAL
// ===============================

const modal =
    document.getElementById("modal");


document.getElementById("resetBtn").onclick = function() {

    modal.classList.add("show");

};


// ===============================
// CLOSE MODAL
// ===============================

document.getElementById("closeModal").onclick = function() {

    modal.classList.remove("show");

};


// ===============================
// SEND PASSWORD RESET EMAIL
// ===============================

document.getElementById("sendOtp").onclick = async function() {

    const email =
        document.getElementById("resetEmail").value.trim();


    if (!email) {

        alert("Please enter your email address.");

        return;
    }


    // 🔥 REAL FIREBASE PASSWORD RESET
    const result =
        await resetPassword(email);


    const otpNotice =
        document.getElementById("otpNotice");


    if (result.success) {

        otpNotice.textContent =
            "Password reset email sent! 📧 Check your inbox.";

        otpNotice.style.display =
            "block";


        console.log(
            "Password reset email sent to:",
            email
        );

    } else {

        otpNotice.textContent =
            result.error;

        otpNotice.style.display =
            "block";
    }
};


// ===============================
// CLOSE MODAL WHEN CLICKING OUTSIDE
// ===============================

modal.onclick = function(event) {

    if (event.target === modal) {

        modal.classList.remove("show");

    }
};

document.getElementById("demoDashboardBtn").addEventListener("click", () => {
    window.location.href = "dashboard.html";
});
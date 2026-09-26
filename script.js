const loginTab =
    document.getElementById("loginTab");

const signupTab =
    document.getElementById("signupTab");

const loginView =
    document.getElementById("loginView");

const signupView =
    document.getElementById("signupView");


/* LOGIN TAB */

function showLogin() {

    loginTab.classList.add("active");

    signupTab.classList.remove("active");

    loginView.style.display = "block";

    signupView.style.display = "none";
}


/* SIGNUP TAB */

function showSignup() {

    signupTab.classList.add("active");

    loginTab.classList.remove("active");

    signupView.style.display = "block";

    loginView.style.display = "none";
}


loginTab.onclick = showLogin;

signupTab.onclick = showSignup;


/* LOGIN */

document
    .getElementById("loginForm")
    .onsubmit = function(event) {

        event.preventDefault();

        document
            .getElementById("loginNotice")
            .style.display = "block";

    };


/* SIGNUP */

document
    .getElementById("signupForm")
    .onsubmit = function(event) {

        event.preventDefault();

        document
            .getElementById("signupNotice")
            .style.display = "block";

    };


/* PASSWORD RESET MODAL */

const modal =
    document.getElementById("modal");


document
    .getElementById("resetBtn")
    .onclick = function() {

        modal.classList.add("show");

    };


/* CLOSE MODAL */

document
    .getElementById("closeModal")
    .onclick = function() {

        modal.classList.remove("show");

    };


/* SEND OTP */

document
    .getElementById("sendOtp")
    .onclick = function() {

        document
            .getElementById("otpNotice")
            .style.display = "block";

    };


/* CLOSE WHEN CLICKING OUTSIDE */

modal.onclick = function(event) {

    if (event.target === modal) {

        modal.classList.remove("show");

    }

};
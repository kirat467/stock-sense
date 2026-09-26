import { auth } from "./backend/firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";


const welcomeName = document.getElementById("welcomeName");
const sidebarName = document.getElementById("sidebarName");
const sidebarEmail = document.getElementById("sidebarEmail");
const sidebarAvatar = document.getElementById("sidebarAvatar");
const topName = document.getElementById("topName");
const topAvatar = document.getElementById("topAvatar");
const logoutBtn = document.getElementById("logoutBtn");


/*
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "index.html";
        return;
    }

    const name = user.displayName || "User";
    const email = user.email || "";

    welcomeName.textContent = name.split(" ")[0];

    sidebarName.textContent = name;
    sidebarEmail.textContent = email;

    topName.textContent = name;

    const firstLetter = name.charAt(0).toUpperCase();
    sidebarAvatar.textContent = firstLetter;
    topAvatar.textContent = firstLetter;
});
*/


logoutBtn.addEventListener("click", async () => {
    try {
        await signOut(auth);
        window.location.href = "index.html";
    } catch (error) {
        console.error("Logout error:", error);
        alert("Unable to logout. Please try again.");
    }
});
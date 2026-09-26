// backend/firebase.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


// 🔥 REPLACE THESE VALUES WITH YOUR FIREBASE CONFIG

const firebaseConfig = {
  apiKey: "AIzaSyA-GYqDLlKgGDBMXkegvUTbKrxaajH-Wek",
  authDomain: "stocksense-38b6d.firebaseapp.com",
  projectId: "stocksense-38b6d",
  storageBucket: "stocksense-38b6d.firebasestorage.app",
  messagingSenderId: "111645142141",
  appId: "1:111645142141:web:a116f11b1deace74f21514",
  measurementId: "G-BWDM4VTWPC"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Authentication
const auth = getAuth(app);

// Firestore database
const db = getFirestore(app);


// Export them so other backend files can use them
export { app, auth, db };
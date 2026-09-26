// backend/auth.js

import { auth, db } from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut,
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


// ===============================
// SIGN UP
// ===============================

async function signupUser(name, email, password) {

    try {

        const userCredential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

        const user = userCredential.user;


        // Save user's name in Firebase Authentication
        await updateProfile(user, {
            displayName: name
        });


        // Save user information in Firestore
        await setDoc(
            doc(db, "users", user.uid),
            {
                uid: user.uid,
                name: name,
                email: email,
                createdAt: serverTimestamp()
            }
        );


        return {
            success: true,
            user: user
        };

    } catch (error) {

        console.error("Signup error:", error);

        return {
            success: false,
            error: getAuthErrorMessage(error.code)
        };
    }
}


// ===============================
// LOGIN
// ===============================

async function loginUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        return {
            success: true,
            user: userCredential.user
        };

    } catch (error) {

        console.error("LOGIN FIREBASE ERROR:", error);

        return {
            success: false,
            error: `${error.code} — ${error.message}`
        };
    }
}


// ===============================
// FORGOT PASSWORD
// ===============================

async function resetPassword(email) {

    try {

        await sendPasswordResetEmail(
            auth,
            email
        );

        return {
            success: true,
            message:
                "Password reset email sent. Check your inbox and spam folder."
        };

    } catch (error) {

        console.error("Password reset error:", error);

        return {
            success: false,
            error: getAuthErrorMessage(error.code)
        };
    }
}


// ===============================
// LOGOUT
// ===============================

async function logoutUser() {

    try {

        await signOut(auth);

        return {
            success: true
        };

    } catch (error) {

        console.error("Logout error:", error);

        return {
            success: false,
            error: error.message
        };
    }
}


// ===============================
// CHECK LOGIN STATE
// ===============================

function watchAuthState(callback) {

    return onAuthStateChanged(
        auth,
        callback
    );
}


// ===============================
// FIREBASE ERROR TRANSLATOR
// ===============================

function getAuthErrorMessage(errorCode) {

    switch (errorCode) {

        case "auth/invalid-email":
            return "Please enter a valid email address.";

        case "auth/email-already-in-use":
            return "This email is already registered. Try logging in.";

        case "auth/weak-password":
            return "Password must be at least 6 characters.";

        case "auth/invalid-credential":
            return "Incorrect email or password.";

        case "auth/user-not-found":
            return "No account exists with this email.";

        case "auth/wrong-password":
            return "Incorrect password.";

        case "auth/too-many-requests":
            return "Too many attempts. Please try again later.";

        case "auth/network-request-failed":
            return "Network error. Check your internet connection.";

        default:
            return "Something went wrong. Please try again.";
    }
}


// ===============================
// EXPORT
// ===============================

export {
    signupUser,
    loginUser,
    resetPassword,
    logoutUser,
    watchAuthState
};
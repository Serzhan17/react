// All Firebase Authentication calls live here. UI components never import firebase directly.
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, googleProvider } from "../firebase.js";

function requireAuth() {
  if (!auth) {
    const error = new Error("Firebase is not configured.");
    error.code = "app/not-configured";
    throw error;
  }
  return auth;
}

export async function signUp(email, password) {
  const credential = await createUserWithEmailAndPassword(requireAuth(), email, password);
  return credential.user;
}

export async function signIn(email, password) {
  const credential = await signInWithEmailAndPassword(requireAuth(), email, password);
  return credential.user;
}

export async function signInWithGoogle() {
  const credential = await signInWithPopup(requireAuth(), googleProvider);
  return credential.user;
}

export function signOutUser() {
  return signOut(requireAuth());
}

// Wrapper around onAuthStateChanged. Returns the unsubscribe function.
export function subscribeToAuth(onUser, onError) {
  if (!auth) {
    queueMicrotask(() => onUser(null));
    return () => {};
  }
  return onAuthStateChanged(auth, onUser, onError);
}

export function authErrorMessage(error) {
  switch (error?.code) {
    case "app/not-configured":
      return "Firebase is not configured. Copy .env.example to .env.local and fill in your Firebase keys.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Invalid email or password.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/weak-password":
      return "Password is too weak (at least 6 characters).";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "The Google sign-in window was closed before finishing.";
    case "auth/popup-blocked":
      return "The browser blocked the sign-in popup. Allow popups and try again.";
    case "auth/unauthorized-domain":
      return "This domain is not authorized in Firebase (Authentication → Settings → Authorized domains).";
    case "auth/operation-not-allowed":
      return "This sign-in method is not enabled in the Firebase console.";
    default:
      return error?.message || "Something went wrong. Please try again.";
  }
}

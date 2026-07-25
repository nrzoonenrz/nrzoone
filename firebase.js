import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyApiKeyForLocalDev12345",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dummy-app.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dummy-app",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dummy-app.appspot.com",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef"
};

// Initialize Firebase safely
let app;
try {
    app = initializeApp(firebaseConfig);
} catch (e) {
    console.warn("Firebase initialization warning:", e);
}

const db = app ? getFirestore(app) : null;
const storage = app ? getStorage(app) : null;
const auth = app ? getAuth(app) : null;

let analytics = null;
if (app && typeof window !== "undefined") {
    isSupported().then(supported => {
        if (supported && import.meta.env.VITE_FIREBASE_APP_ID) {
            try {
                analytics = getAnalytics(app);
            } catch (e) {
                console.warn("Analytics initialization warning:", e);
            }
        }
    }).catch(() => {});
}

export { db, storage, analytics, auth };

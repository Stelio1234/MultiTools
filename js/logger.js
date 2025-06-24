// firebase-logger.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBHSuqEhGYcRd_6GsMDI0bHDy3_5v0lD9g",
  authDomain: "multitools-48cc8.firebaseapp.com",
  projectId: "multitools-48cc8",
  storageBucket: "multitools-48cc8.firebasestorage.app",
  messagingSenderId: "1048886823672",
  appId: "1:1048886823672:web:71f0ff40e2a9642de2890d",
  measurementId: "G-JG6J0KRN08"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

function collectDeviceInfo(user) {
  const deviceInfo = {
    uid: user?.uid || null,
    email: user?.email || null,
    timestamp: new Date().toISOString(),
    platform: navigator.platform,
    userAgent: navigator.userAgent,
    screenSize: `${screen.width}x${screen.height}`,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };

  addDoc(collection(db, "logs"), deviceInfo)
    .then(() => console.log("✅ Device info logged to Firestore"))
    .catch((err) => console.error("🔥 Error logging device info:", err));
}

onAuthStateChanged(auth, (user) => {
  collectDeviceInfo(user);
});
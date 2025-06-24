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

let currentUser = null;
let sessionStartTime = Date.now();

// Log device info when user logs in/out
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

// Log tool usage - call this whenever a user uses a tool
export async function logToolUsage(toolName) {
  const toolEvent = {
    uid: currentUser?.uid || null,
    email: currentUser?.email || null,
    tool: toolName,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    screenSize: `${screen.width}x${screen.height}`,
  };

  try {
    await addDoc(collection(db, "tool_usage"), toolEvent);
    console.log(`✅ Tool usage logged: ${toolName}`);
  } catch (err) {
    console.error("🔥 Error logging tool usage:", err);
  }
}

// Log page views - call this on page load/navigation
export async function logPageView(path) {
  const pageView = {
    uid: currentUser?.uid || null,
    email: currentUser?.email || null,
    path,
    timestamp: new Date().toISOString(),
    referrer: document.referrer || "",
  };

  try {
    await addDoc(collection(db, "page_views"), pageView);
    console.log(`✅ Page view logged: ${path}`);
  } catch (err) {
    console.error("🔥 Error logging page view:", err);
  }
}

// Log session duration when user leaves page
function logSessionDuration() {
  const sessionDuration = Math.round((Date.now() - sessionStartTime) / 1000); // seconds

  const sessionData = {
    uid: currentUser?.uid || null,
    email: currentUser?.email || null,
    durationSeconds: sessionDuration,
    timestamp: new Date().toISOString(),
    path: window.location.pathname,
  };

  addDoc(collection(db, "session_logs"), sessionData)
    .then(() => console.log("✅ Session duration logged"))
    .catch((err) => console.error("🔥 Error logging session duration:", err));
}

// Error logging for uncaught JS errors
window.onerror = function (message, source, lineno, colno, error) {
  const errorData = {
    uid: currentUser?.uid || null,
    message,
    source,
    lineno,
    colno,
    stack: error?.stack || "n/a",
    timestamp: new Date().toISOString(),
  };

  addDoc(collection(db, "error_logs"), errorData)
    .then(() => console.log("✅ JS error logged"))
    .catch((err) => console.error("🔥 Error logging JS error:", err));
};

// Handle auth state changes
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (user) {
    collectDeviceInfo(user);
    sessionStartTime = Date.now();
  } else {
    currentUser = null;
  }
});

// Log session duration when user closes or reloads page
window.addEventListener("beforeunload", logSessionDuration);

// Optional: call this on each page load for navigation logging
// You can call logPageView(window.location.pathname) in your main JS entrypoint
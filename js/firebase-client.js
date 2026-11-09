(() => {
  'use strict';
  const localTest = ['localhost', '127.0.0.1'].includes(location.hostname) && new URLSearchParams(location.search).get('emulator') === '1';
  firebase.initializeApp({
    apiKey: 'AIzaSyBHSuqEhGYcRd_6GsMDI0bHDy3_5v0lD9g',
    authDomain: 'multitools-48cc8.firebaseapp.com',
    projectId: localTest ? 'demo-multitools' : 'multitools-48cc8',
    storageBucket: 'multitools-48cc8.firebasestorage.app',
    messagingSenderId: '1048886823672',
    appId: '1:1048886823672:web:71f0ff40e2a9642de2890d',
    measurementId: 'G-JG6J0KRN08'
  });
  const auth = firebase.auth();
  const db = firebase.firestore();
  if (localTest) {
    auth.useEmulator('http://127.0.0.1:9099', { disableWarnings: true });
    db.useEmulator('127.0.0.1', 8080);
  }
  const ready = auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
  ready.catch(() => { /* Each page presents its own initialization error. */ });
  const sameUser = user => Boolean(user && auth.currentUser === user);
  const fresh = (token, seconds) => Number.isFinite(Number(token.claims.auth_time)) && Date.now() / 1000 - Number(token.claims.auth_time) < seconds;
  let ownerPromise;
  const getOwner = () => ownerPromise ||= fetch('/owner.json', { cache: 'no-store' })
    .then(response => response.ok ? response.json() : null)
    .then(value => typeof value?.uid === 'string' && value.uid.length > 0 ? value.uid : null)
    .catch(() => null);
  async function isOwner(user = auth.currentUser) {
    return Boolean(user && user.emailVerified && user.uid === await getOwner());
  }
  async function requireOwner() {
    await ready;
    const user = auth.currentUser;
    if (!await isOwner(user)) throw new Error('Administrator access denied.');
    const token = await user.getIdTokenResult(true);
    if (!sameUser(user)) throw new Error('Your account changed. Sign in again to continue.');
    if (!fresh(token, 1800)) {
      if (sameUser(user)) await auth.signOut();
      throw new Error('Sign in again to continue.');
    }
    return user;
  }
  async function getAdminAccess(user = auth.currentUser) {
    await ready;
    if (!user?.emailVerified || auth.currentUser?.uid !== user.uid) return null;
    const token = await user.getIdTokenResult();
    if (!sameUser(user) || !fresh(token, 1800)) return null;
    const owner = await isOwner(user);
    if (!sameUser(user)) return null;
    if (owner) return { uid: user.uid, owner: true, permissions: { readUsers: true, exportEmails: true, manageEmailPreferences: true, viewSecurity: true, managePrivacyRequests: true } };
    const role = await db.collection('admin_roles').doc(user.uid).get({ source: 'server' });
    if (!sameUser(user) || !role.exists || role.data().active !== true) return null;
    return { uid: user.uid, owner: false, permissions: role.data().permissions || {} };
  }
  async function requireStaff(permission) {
    const access = await getAdminAccess();
    if (!access || (permission === 'owner' ? !access.owner : permission && access.permissions[permission] !== true)) {
      throw new Error('Your administrator session or permission is unavailable. Sign in again or contact the owner.');
    }
    return access;
  }
  async function canAdmin(user = auth.currentUser) {
    try { return Boolean(await getAdminAccess(user)); } catch { return false; }
  }
  async function logEvent(event) {
    const user = auth.currentUser;
    if (!user?.emailVerified) return;
    try {
      const bucket = Math.floor(Date.now() / 60000);
      const write = db.collection('logs').doc(`${user.uid}_${bucket}`).set({
        uid: user.uid, event, source: 'browser', bucket, timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      await Promise.race([write.catch(() => {}), new Promise(resolve => setTimeout(resolve, 1000))]);
    } catch { /* Logging must not prevent authentication or logout. */ }
  }
  async function reauthenticate() {
    const user = auth.currentUser;
    if (!user) throw new Error('Sign in again to continue.');
    if (user.providerData.some(provider => provider.providerId === 'password')) {
      const password = prompt('Confirm your password to continue:');
      if (!password) throw new Error('Confirmation cancelled.');
      await user.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(user.email, password));
    } else if (user.providerData.some(provider => provider.providerId === 'google.com')) {
      await user.reauthenticateWithPopup(new firebase.auth.GoogleAuthProvider());
    } else {
      throw new Error('Sign in again using your account provider.');
    }
    if (!sameUser(user)) throw new Error('Your account changed. Please try again.');
    return user;
  }
  let lastActivity = Date.now();
  for (const event of ['pointerdown', 'keydown', 'touchstart']) {
    window.addEventListener(event, () => { lastActivity = Date.now(); }, { passive: true });
  }
  setInterval(async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const token = await user.getIdTokenResult();
      if (sameUser(user) && (Date.now() - lastActivity > 1800000 || !fresh(token, 43200))) {
        await auth.signOut();
      }
    } catch { if (sameUser(user)) await auth.signOut(); }
  }, 30000);
  window.MultiTools = { auth, db, ready, getOwner, isOwner, requireOwner, getAdminAccess, requireStaff, canAdmin, logEvent, reauthenticate };
})();

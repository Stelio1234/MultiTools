(() => {
  'use strict';
  const { auth, db, ready, canAdmin, logEvent } = MultiTools;
  const welcome = document.getElementById('welcome');
  const login = document.getElementById('login-btn');
  const adminLink = document.getElementById('admin-link');
  login.addEventListener('click', async () => {
    if (!auth.currentUser) { location.assign('/login.html'); return; }
    try { await logEvent('logout'); await auth.signOut(); }
    catch { welcome.textContent = 'Unable to sign out. Try again.'; }
  });
  ready.then(() => auth.onAuthStateChanged(async user => {
    adminLink.hidden = true;
    login.textContent = user ? 'Log Out' : 'Log In';
    welcome.textContent = user ? `Welcome, ${user.displayName || 'User'}` : "You're not logged in.";
    if (!user) return;
    const uid = user.uid;
    try {
      const profile = await db.collection('users').doc(uid).get();
      if (auth.currentUser?.uid === uid) welcome.textContent = `Welcome, ${profile.data()?.username || user.displayName || 'User'}`;
    } catch { /* The public tools remain available when profiles are unavailable. */ }
    const allowed = await canAdmin(user);
    if (auth.currentUser?.uid === uid) adminLink.hidden = !allowed;
  })).catch(() => { welcome.textContent = 'Account services are unavailable.'; });
})();

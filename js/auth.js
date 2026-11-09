(() => {
  'use strict';
  const { auth, db, ready, logEvent } = MultiTools;
  const get = id => document.getElementById(id);
  const status = get('authStatus');
  let busy = false;
  let authEpoch = 0;
  const sameUser = user => Boolean(user && auth.currentUser === user);
  function requireUser(user) { if (!sameUser(user)) throw Object.assign(new Error('Your account changed. Please try again.'), { code: 'account/session-changed' }); }
  function clearAttempts() { try { sessionStorage.removeItem('authAttempts'); } catch { /* Optional UI cooldown storage. */ } }
  const message = text => { status.textContent = text; };
  function cooldown() {
    try {
      const value = JSON.parse(sessionStorage.getItem('authAttempts') || '{}');
      return Number(value.until) > Date.now();
    } catch { return false; }
  }
  function failure() {
    try {
      const prior = JSON.parse(sessionStorage.getItem('authAttempts') || '{}');
      const count = (Number(prior.count) || 0) + 1;
      sessionStorage.setItem('authAttempts', JSON.stringify({ count, until: Date.now() + Math.min(60000, 1000 * 2 ** Math.min(count, 6)) }));
    } catch { /* Firebase applies service-side abuse limits independently. */ }
  }
  async function run(action) {
    if (busy) return;
    if (cooldown()) return message('Please wait a moment before trying again.');
    busy = true;
    const controls = [...document.querySelectorAll('form button, form input')].map(element => [element, element.disabled]);
    controls.forEach(([element]) => { element.disabled = true; });
    try { await ready; await action(); }
    catch (error) {
      if (error.code === 'account/session-changed') return;
      if (!['auth/popup-closed-by-user', 'auth/cancelled-popup-request'].includes(error.code)) failure();
      message(error.code === 'auth/too-many-requests' ? 'Too many attempts. Please try again later.' : 'Unable to complete this request. Check your details or try again later.');
      await logEvent('login_failure');
    } finally {
      get('password').value = '';
      get('regPassword').value = '';
      controls.forEach(([element, disabled]) => { element.disabled = disabled; });
      busy = false;
    }
  }
  async function deletionPending(user) {
    const request = await db.collection('privacy_requests').doc(user.uid + '_erasure').get({ source: 'server' }); requireUser(user);
    return request.exists && !['rejected', 'cancelled'].includes(request.data().status);
  }
  async function finish(user, username) {
    requireUser(user);
    const existing = await db.collection('users').doc(user.uid).get({ source: 'server' });
    requireUser(user);
    if (!existing.exists) {
      if (await deletionPending(user)) { location.assign('/settings.html'); return; }
      setup(username); return;
    }
    try { await existing.ref.update({ lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(), emailVerified: user.emailVerified }); requireUser(user); }
    catch { if (sameUser(user)) message('Signed in, but your profile could not be saved. Contact support if this continues.'); return; }
    await logEvent('login_success');
    requireUser(user);
    const next = new URLSearchParams(location.search).get('next');
    location.assign(next === 'admin' ? '/admin.html' : '/');
  }
  get('loginForm').addEventListener('submit', event => {
    event.preventDefault();
    run(async () => {
      const result = await auth.signInWithEmailAndPassword(get('email').value.trim(), get('password').value);
      clearAttempts();
      await finish(result.user, 'User');
    });
  });
  get('registerForm').addEventListener('submit', event => {
    event.preventDefault();
    run(async () => {
      const username = get('regUsername').value.trim();
      const marketingChoice = get('regMarketing').checked;
      const error = UsernamePolicy.validate(username);
      if (error) { message(error); return; }
      if (!await AccountData.usernamesReady()) { message('New accounts are paused while existing usernames are secured. Existing users can sign in with email.'); return; }
      const result = await auth.createUserWithEmailAndPassword(get('regEmail').value.trim(), get('regPassword').value);
      clearAttempts(); requireUser(result.user);
      try { await AccountData.createProfile(username, marketingChoice); requireUser(result.user); }
      catch (error) { if (sameUser(result.user)) { setup(username, marketingChoice); message(error.message); } return; }
      try { await result.user.sendEmailVerification(); } catch { if (sameUser(result.user)) message('Your account was created. Use Settings to resend verification if the email does not arrive.'); return; }
      requireUser(result.user); message('Account created. Verification email requested; check your inbox, then open Settings to refresh verification.');
    });
  });
  function setup(username = '', choice = false) {
    document.querySelectorAll('form').forEach(form => { form.hidden = form.id !== 'setupProfileForm'; });
    get('setupUsername').value = UsernamePolicy.validate(username) ? '' : username.trim();
    get('setupMarketing').checked = choice;
    message('Your sign-in credentials are preserved. Choose a unique username to finish account setup.');
  }
  get('setupProfileForm').addEventListener('submit', event => {
    event.preventDefault(); run(async () => {
      const user = auth.currentUser;
      await AccountData.createProfile(get('setupUsername').value, get('setupMarketing').checked);
      requireUser(user);
      if (!user.emailVerified) { try { await user.sendEmailVerification(); } catch { /* Settings can resend. */ } }
      await finish(user, get('setupUsername').value);
    });
  });
  get('resetForm').addEventListener('submit', event => {
    event.preventDefault();
    run(async () => {
      try { await auth.sendPasswordResetEmail(get('resetEmail').value.trim()); }
      catch { /* Keep the response identical for eligible and unknown addresses. */ }
      message('If an eligible account exists, a password reset email was requested. Check your inbox and wait before requesting another.');
    });
  });
  for (const button of document.querySelectorAll('[data-google]')) {
    button.addEventListener('click', () => run(async () => {
      const result = await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
      clearAttempts();
      const username = (result.user.displayName || 'User').replace(/[^a-zA-Z0-9 _-]/g, '').slice(0, 32).padEnd(3, '_');
      await finish(result.user, username);
    }));
  }
  for (const button of document.querySelectorAll('[data-form]')) {
    button.addEventListener('click', () => {
      authEpoch++;
      for (const form of document.querySelectorAll('form')) form.hidden = form.id !== button.dataset.form;
      message('');
      get(button.dataset.form).querySelector('input').focus();
    });
  }
  ready.then(() => auth.onAuthStateChanged(user => {
    const epoch = ++authEpoch;
    if (!user || busy) return;
    (async () => {
      const profile = await db.collection('users').doc(user.uid).get({ source: 'server' });
      if (epoch !== authEpoch || busy || !sameUser(user) || profile.exists) return;
      const deleting = await deletionPending(user);
      if (epoch !== authEpoch || busy || !sameUser(user)) return;
      if (deleting) { message('Account deletion is awaiting completion. Open Account settings to retry deletion or contact support.'); return; }
      setup(user.displayName || '');
    })().catch(() => { if (epoch === authEpoch && !busy && sameUser(user)) message('Your saved session is available, but profile recovery could not be checked. Try signing in again.'); });
  })).catch(() => { message('Account services are unavailable. Reload this page to try again.'); });
})();

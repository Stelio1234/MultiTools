(() => {
  'use strict';
  const { auth, db, ready, logEvent } = MultiTools;
  const get = id => document.getElementById(id);
  let busy = false, authEpoch = 0, completingSignup = false;
  const sameUser = user => Boolean(user && auth.currentUser === user);
  function requireUser(user) { if (!sameUser(user)) throw Object.assign(new Error('Your account changed. Please try again.'), { code: 'account/session-changed' }); }
  const message = text => { get('authStatus').textContent = text; };
  function showForm(id) {
    document.querySelectorAll('form').forEach(form => { form.hidden = form.id !== id; });
    get(id).querySelector('input')?.focus();
  }
  function clearAttempts() { try { sessionStorage.removeItem('authAttempts'); } catch { /* Firebase enforces its own abuse controls. */ } }
  function cooldown() {
    try { return Number(JSON.parse(sessionStorage.getItem('authAttempts') || '{}').until) > Date.now(); } catch { return false; }
  }
  function failure() {
    try {
      const count = (Number(JSON.parse(sessionStorage.getItem('authAttempts') || '{}').count) || 0) + 1;
      sessionStorage.setItem('authAttempts', JSON.stringify({ count, until: Date.now() + Math.min(60000, 1000 * 2 ** Math.min(count, 6)) }));
    } catch { /* UI cooldown storage is optional. */ }
  }
  function profileFailure(error) {
    if (error.code?.startsWith('account/')) return error.message;
    if (error.code === 'permission-denied') return 'Your sign-in account exists, but your profile could not be saved. Please contact support@themultitools.xyz, then retry Complete profile. Your credentials are preserved.';
    return 'Your sign-in account exists, but its profile could not be saved. Check your connection and retry Complete profile. Your credentials are preserved.';
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
      if (error.code?.startsWith('account/')) { message(error.message); return; }
      const guidance = {
        'auth/popup-blocked': 'Your browser blocked the Google sign-in window. Allow popups for this site and try again.',
        'auth/popup-closed-by-user': 'Google sign-in was canceled. You can try again.',
        'auth/cancelled-popup-request': 'Google sign-in was canceled. You can try again.',
        'auth/network-request-failed': 'The sign-in service could not be reached. Check your connection and try again.',
        'auth/web-storage-unsupported': 'Your browser is blocking the storage required for sign-in. Allow site storage and reload.'
      };
      if (guidance[error.code]) { message(guidance[error.code]); return; }
      if (error.code?.startsWith('auth/')) { failure(); await logEvent('login_failure'); }
      message(error.code === 'auth/too-many-requests' ? 'Too many attempts. Please try again later.' : 'Unable to complete this request. Check your details or try again later.');
    } finally {
      get('password').value = ''; get('regPassword').value = '';
      controls.forEach(([element, disabled]) => { element.disabled = disabled; }); busy = false;
    }
  }
  async function deletionPending(user) {
    const request = await db.collection('privacy_requests').doc(user.uid + '_erasure').get({ source: 'server' }); requireUser(user);
    return request.exists && !['rejected', 'cancelled'].includes(request.data().status);
  }
  function defaultUsername(user, requested = '') {
    if (requested && !UsernamePolicy.validate(requested)) return requested.trim();
    const name = String(user.displayName || '').replace(/[^a-zA-Z0-9 _-]/g, '').slice(0, 32).replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
    return !UsernamePolicy.validate(name) ? name : 'User ' + (user.uid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12) || 'Account');
  }
  function setup(user, username = '', signup = false, choice = false) {
    requireUser(user); completingSignup = signup; showForm('setupProfileForm');
    get('setupUsername').value = defaultUsername(user, username); get('setupMarketing').checked = choice;
    message('Your sign-in credentials are preserved. Complete your profile to continue.');
  }
  async function returnToLogin(user, result, google = false) {
    requireUser(user); let verificationRequested = false;
    if (!google && !user.emailVerified) { try { await user.sendEmailVerification(); verificationRequested = true; } catch { /* Settings can resend. */ } }
    requireUser(user); const email = user.email || ''; await auth.signOut();
    if (auth.currentUser) throw Object.assign(new Error('Your account changed.'), { code: 'account/session-changed' });
    authEpoch++; completingSignup = false; showForm('loginForm'); get('email').value = email;
    const prefix = result.created ? 'Account created and profile saved.' : 'Your account profile is ready.';
    const instruction = google ? ' Log in with Google to continue.' : verificationRequested ? ' Verification email requested. Log in to continue.' : ' Log in to continue; you can request verification from Settings.';
    message(prefix + instruction + (result.pending ? ' Your username is pending availability review; your account and email preferences are saved.' : ''));
  }
  async function finish(user) {
    requireUser(user); let profile = await db.collection('users').doc(user.uid).get({ source: 'server' }); requireUser(user);
    if (!profile.exists) {
      if (await deletionPending(user)) { location.assign('/settings.html'); return; }
      try { await AccountData.createProfile(defaultUsername(user), false); requireUser(user); }
      catch (error) { if (sameUser(user)) { setup(user); message(profileFailure(error)); } return; }
      profile = await db.collection('users').doc(user.uid).get({ source: 'server' }); requireUser(user);
    }
    try { await profile.ref.update({ lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(), emailVerified: user.emailVerified }); requireUser(user); }
    catch { if (sameUser(user)) message('Signed in, but your profile sync failed. Try again or contact support.'); return; }
    await logEvent('login_success'); requireUser(user);
    location.assign(new URLSearchParams(location.search).get('next') === 'admin' ? '/admin.html' : '/');
  }
  get('loginForm').addEventListener('submit', event => {
    event.preventDefault(); const email = get('email').value.trim(), password = get('password').value;
    run(async () => { const result = await auth.signInWithEmailAndPassword(email, password); clearAttempts(); await finish(result.user); });
  });
  get('registerForm').addEventListener('submit', event => {
    event.preventDefault(); const username = get('regUsername').value.trim(), email = get('regEmail').value.trim(), password = get('regPassword').value, choice = get('regMarketing').checked;
    const error = UsernamePolicy.validate(username); if (error) { message(error); return; }
    run(async () => {
      const result = await auth.createUserWithEmailAndPassword(email, password); clearAttempts(); requireUser(result.user);
      try { const saved = await AccountData.createProfile(username, choice); await returnToLogin(result.user, saved); }
      catch (error) { if (sameUser(result.user)) { setup(result.user, username, true, choice); message(profileFailure(error)); } }
    });
  });
  get('setupProfileForm').addEventListener('submit', event => {
    event.preventDefault(); const username = get('setupUsername').value.trim(), choice = get('setupMarketing').checked;
    const error = UsernamePolicy.validate(username); if (error) { message(error); return; }
    run(async () => {
      const user = auth.currentUser; let saved;
      try { saved = await AccountData.createProfile(username, choice); requireUser(user); }
      catch (error) { if (sameUser(user)) message(profileFailure(error)); return; }
      if (completingSignup) await returnToLogin(user, saved, user.providerData.some(provider => provider.providerId === 'google.com'));
      else await finish(user);
    });
  });
  get('resetForm').addEventListener('submit', event => {
    event.preventDefault(); const email = get('resetEmail').value.trim(); run(async () => {
      try { await auth.sendPasswordResetEmail(email); } catch { /* Same response for eligible and unknown accounts. */ }
      message('If an eligible account exists, a password reset email was requested. Check your inbox and wait before requesting another.');
    });
  });
  document.querySelectorAll('[data-google]').forEach(button => button.addEventListener('click', () => {
    const signingUp = button.closest('form').id === 'registerForm', requested = signingUp ? get('regUsername').value.trim() : '', choice = signingUp && get('regMarketing').checked;
    if (requested && UsernamePolicy.validate(requested)) { message(UsernamePolicy.validate(requested)); return; }
    run(async () => {
      const result = await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()); clearAttempts(); requireUser(result.user);
      if (signingUp || result.additionalUserInfo?.isNewUser) {
        try { const saved = await AccountData.createProfile(defaultUsername(result.user, requested), choice); await returnToLogin(result.user, saved, true); }
        catch (error) { if (sameUser(result.user)) { setup(result.user, requested, true, choice); message(profileFailure(error)); } }
      } else await finish(result.user);
    });
  }));
  document.querySelectorAll('[data-form]').forEach(button => button.addEventListener('click', () => {
    if (busy) return; authEpoch++; showForm(button.dataset.form); message('');
  }));
  ready.then(() => auth.onAuthStateChanged(user => {
    const epoch = ++authEpoch; if (!user || busy) return;
    (async () => {
      const profile = await db.collection('users').doc(user.uid).get({ source: 'server' });
      if (epoch !== authEpoch || busy || !sameUser(user) || profile.exists) return;
      const deleting = await deletionPending(user); if (epoch !== authEpoch || busy || !sameUser(user)) return;
      if (deleting) { message('Account deletion is awaiting completion. Open Account settings to retry deletion or contact support.'); return; }
      try { await AccountData.createProfile(defaultUsername(user), false); if (epoch === authEpoch && !busy && sameUser(user)) message('Your missing profile has been saved. You can log in or open Account settings.'); }
      catch (error) { if (epoch === authEpoch && !busy && sameUser(user)) { setup(user); message(profileFailure(error)); } }
    })().catch(() => { if (epoch === authEpoch && !busy && sameUser(user)) message('Your saved session is available, but profile recovery could not be checked. Try signing in again.'); });
  })).catch(() => { message('Account services are unavailable. Reload this page to try again.'); });
})();

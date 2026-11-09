(() => {
  'use strict';
  const { auth, db, ready, reauthenticate, logEvent, isOwner, canAdmin } = MultiTools;
  const get = id => document.getElementById(id);
  let epoch = 0, activeUser = null, busy = false, profileExists = null, preference, preferenceLoaded = false, verificationUntil = 0, erasurePending = false;
  const message = text => { get('accountStatus').textContent = text; };
  const current = context => context.epoch === epoch && activeUser === context.user && auth.currentUser === context.user;
  function requireCurrent(context) { if (!current(context)) throw new Error('Your account changed. Please try again.'); }
  function clearPrivate() {
    epoch++; activeUser = null; busy = false; profileExists = null; preference = undefined; preferenceLoaded = false; verificationUntil = 0; erasurePending = false;
    get('account-content').hidden = true; get('admin-link').hidden = true;
    for (const id of ['userEmail', 'userUid', 'signInMethod', 'verificationStatus', 'currentUsername', 'emailPreferenceStatus', 'privacy-status', 'accountStatus']) get(id).textContent = '';
    get('privacy-requests').replaceChildren(); get('privacy-details').value = ''; get('newUsername').value = '';
  }
  function controls() {
    if (!activeUser) return;
    const status = MarketingPolicy.status(preference), suppressed = preference?.suppressed === true || preference?.status === 'suppressed';
    const addressMatches = String(preference?.address || '').toLowerCase() === String(activeUser.email || '').toLowerCase();
    get('verifyEmail').disabled = busy || activeUser.emailVerified || Date.now() < verificationUntil;
    get('subscribeMarketing').disabled = busy || !preferenceLoaded || profileExists !== true || !activeUser.emailVerified || suppressed || (status === 'subscribed' && addressMatches);
    get('unsubscribeMarketing').disabled = busy || !preferenceLoaded || profileExists !== true || suppressed || status === 'unsubscribed';
    get('rename-form').querySelector('button[type="submit"]').disabled = busy || profileExists !== true;
    if (profileExists === false && erasurePending) { get('finishProfile').hidden = true; get('currentUsername').textContent = 'Your profile has been removed. Retry account deletion or contact support to complete the remaining cleanup.'; }
  }
  async function operation(action, fallback, target = 'accountStatus') {
    if (busy || !activeUser || auth.currentUser !== activeUser) return;
    const context = { user: activeUser, epoch }; busy = true;
    const fields = [...document.querySelectorAll('#account-content button:not(#logout), #account-content input, #account-content select, #account-content textarea')].map(element => [element, element.disabled]);
    fields.forEach(([element]) => { element.disabled = true; });
    try { await action(context); }
    catch (error) { if (current(context)) get(target).textContent = fallback || error.message || 'Unable to complete this request.'; }
    finally {
      if (current(context)) { busy = false; fields.forEach(([element, disabled]) => { element.disabled = disabled; }); controls(); }
    }
  }
  async function loadEmailPreference(context) {
    try {
      const doc = await db.collection('email_preferences').doc(context.user.uid).get({ source: 'server' }); if (!current(context)) return;
      preference = doc.data(); preferenceLoaded = true;
      const status = MarketingPolicy.status(preference), suppressed = preference?.suppressed === true || preference?.status === 'suppressed';
      const addressMatches = String(preference?.address || '').toLowerCase() === String(context.user.email || '').toLowerCase();
      const currentStatus = status === 'subscribed' && !addressMatches ? 'unknown' : status;
      get('emailPreferenceStatus').textContent = currentStatus === 'subscribed'
        ? 'Email subscription: subscribed. You have opted in to MultiTools marketing emails.'
        : currentStatus === 'unsubscribed'
          ? suppressed ? 'Email subscription: unsubscribed (delivery suppressed).' : 'Email subscription: unsubscribed.'
          : 'Email subscription: not subscribed — no opt-in is recorded for your current email address.';
      if (currentStatus === 'subscribed' && !context.user.emailVerified) get('emailPreferenceStatus').textContent += ' Verify your email before marketing messages can be delivered.';
      const changed = preference?.updatedAt?.toDate?.(); if (changed) get('emailPreferenceStatus').textContent += ` Last changed: ${changed.toLocaleString()}.`;
      if (suppressed) get('emailPreferenceStatus').textContent += ' Contact the owner to review suppression.';
    } catch { if (current(context)) { preferenceLoaded = false; get('emailPreferenceStatus').textContent = 'Email preferences are unavailable. Contact support for unsubscribe requests.'; } }
    if (current(context)) controls();
  }
  async function loadProfile(context) {
    try {
      const result = await db.collection('users').doc(context.user.uid).get({ source: 'server' }); if (!current(context)) return;
      profileExists = result.exists;
      const data = result.data();
      get('currentUsername').textContent = data?.usernameStatus === 'pending'
        ? `${data.username} (pending availability review). Your account is saved; this name is not reserved yet.`
        : data?.username || 'Your profile setup is incomplete. Use the finish-setup link below.';
      get('finishProfile').hidden = result.exists;
    } catch { if (current(context)) get('currentUsername').textContent = 'Username unavailable. Please try again later.'; }
    if (current(context)) controls();
  }
  async function loadRequests(context) {
    try {
      const result = await PrivacyData.listOwn(); if (!current(context)) return;
      erasurePending = result.docs.some(doc => doc.data().type === 'erasure' && !['rejected', 'cancelled'].includes(doc.data().status)); controls();
      get('privacy-requests').replaceChildren(...result.docs.map(doc => {
        const data = doc.data(), item = document.createElement('li');
        item.textContent = `${data.type.replaceAll('_', ' ')}: ${data.status.replaceAll('_', ' ')} — submitted ${data.submittedAt?.toDate?.().toLocaleString() || 'recently'}${data.completedAt ? '; completed ' + data.completedAt.toDate().toLocaleString() : ''}${data.resultNote ? '. ' + data.resultNote : ''}`; return item;
      }));
    } catch { if (current(context)) get('privacy-status').textContent = 'Requests are unavailable. Please contact support.'; }
  }
  async function start(user) {
    clearPrivate(); if (!user) { location.replace('/login.html'); return; }
    activeUser = user; const context = { user, epoch };
    get('userEmail').textContent = user.email; get('userUid').textContent = user.uid;
    get('signInMethod').textContent = user.providerData.map(item => item.providerId).join(', ');
    get('verificationStatus').textContent = user.emailVerified ? 'Verified' : 'Not verified';
    get('account-loading').hidden = true; get('account-content').hidden = false; get('finishProfile').hidden = true; controls();
    await Promise.all([loadProfile(context), loadEmailPreference(context), loadRequests(context), canAdmin(user).then(allowed => { if (current(context)) get('admin-link').hidden = !allowed; })]);
  }
  ready.then(() => auth.onAuthStateChanged(user => {
    start(user).catch(() => { if (auth.currentUser === user) message('Account services are unavailable. Please sign in again.'); });
  })).catch(() => { clearPrivate(); get('account-loading').hidden = false; get('account-loading').textContent = 'Account services are unavailable. Reload this page or return to sign in.'; });
  window.addEventListener('pagehide', clearPrivate);
  window.addEventListener('pageshow', event => { if (event.persisted) location.reload(); });
  get('logout').addEventListener('click', async () => {
    const user = auth.currentUser; if (!user) return; clearPrivate();
    try { await logEvent('logout'); if (auth.currentUser === user) await auth.signOut(); }
    catch { if (auth.currentUser === user) { await start(user); message('Unable to sign out. Please try again.'); } }
  });
  get('verifyEmail').addEventListener('click', () => operation(async context => {
    await context.user.sendEmailVerification(); requireCurrent(context); verificationUntil = Date.now() + 60000;
    message('Verification email requested. Check your inbox.');
    setTimeout(() => { if (current(context)) controls(); }, 60000);
  }, 'Unable to send verification email. Try again later.'));
  get('refreshVerification').addEventListener('click', () => operation(async context => {
    const user = context.user; await user.reload(); requireCurrent(context); await user.getIdToken(true); requireCurrent(context);
    get('verificationStatus').textContent = user.emailVerified ? 'Verified' : 'Not verified';
    let synchronized = true;
    try { if (profileExists) { await db.collection('users').doc(user.uid).update({ emailVerified: user.emailVerified }); requireCurrent(context); } } catch { synchronized = false; }
    const allowed = await canAdmin(user); requireCurrent(context); get('admin-link').hidden = !allowed;
    await loadEmailPreference(context); requireCurrent(context);
    message(synchronized ? 'Verification status refreshed.' : 'Verification refreshed, but the profile sync failed. Try again later.');
  }, 'Unable to refresh. Sign out and sign in again.'));
  get('changePassword').addEventListener('click', () => operation(async context => {
    const user = await reauthenticate(); requireCurrent(context); await auth.sendPasswordResetEmail(user.email); requireCurrent(context);
    message('Password reset email requested.'); await logEvent('password_reset_requested');
  }, 'Unable to request a password reset. Confirm your identity and try again.'));
  get('deleteAccount').addEventListener('click', () => operation(async context => {
    if (!confirm('Delete your sign-in account, profile, email preferences and current username reservation? A tracked erasure case remains for historical records, old username aliases and connected services.')) return;
    const user = await reauthenticate(); requireCurrent(context); const owner = await isOwner(user); requireCurrent(context);
    if (owner) { message('The owner account cannot be deleted here. Contact Firebase project administration.'); return; }
    try { await PrivacyData.deleteSelf(); }
    catch (error) { if (current(context)) await Promise.all([loadProfile(context), loadEmailPreference(context), loadRequests(context)]); throw error; }
  }, 'Deletion could not be completed. Retry from Settings or contact support; profile cleanup and sign-in deletion are separate operations.'));
  get('privacy-form').addEventListener('submit', event => {
    event.preventDefault(); const type = get('privacy-type').value, details = get('privacy-details').value;
    operation(async context => { await PrivacyData.submit(type, details); requireCurrent(context); get('privacy-status').textContent = 'Request submitted. An operator must review and verify fulfillment.'; get('privacy-details').value = ''; await loadRequests(context); }, null, 'privacy-status');
  });
  get('rename-form').addEventListener('submit', event => {
    event.preventDefault(); const username = get('newUsername').value.trim();
    const error = UsernamePolicy.validate(username); if (error) { message(error); return; }
    operation(async context => { await reauthenticate(); requireCurrent(context); await AccountData.rename(username); requireCurrent(context); get('currentUsername').textContent = username; message('Username changed. Your sign-in email and account UID stay the same.'); });
  });
  get('downloadMyData').addEventListener('click', () => operation(async context => {
    const user = await reauthenticate(); requireCurrent(context);
    const [profile, preferences] = await Promise.all([db.collection('users').doc(user.uid).get({ source: 'server' }), db.collection('email_preferences').doc(user.uid).get({ source: 'server' })]); requireCurrent(context);
    await db.collection('logs').add({ kind: 'administration', outcome: 'committed', action: 'privacy_data_exported', actorUid: user.uid, targetUid: user.uid, timestamp: firebase.firestore.FieldValue.serverTimestamp(), details: { scope: 'profile_preferences' } }); requireCurrent(context);
    const url = URL.createObjectURL(new Blob([JSON.stringify({ scope: 'Own Firestore profile and email preferences only; request access for a wider review.', exportedAt: new Date().toISOString(), uid: user.uid, profile: profile.data() || null, emailPreferences: preferences.data() || null }, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'multitools-my-data.json'; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); message('Your profile and preferences download was prepared.');
  }, 'Unable to prepare your download. Confirm your identity and try again.'));
  for (const [id, status] of [['subscribeMarketing', 'subscribed'], ['unsubscribeMarketing', 'unsubscribed']]) get(id).addEventListener('click', () => operation(async context => {
    if (status === 'subscribed' && !confirm('I want to receive MultiTools marketing emails. I can unsubscribe in account settings.')) return;
    await AccountData.setMarketing(status); requireCurrent(context);
    message(status === 'subscribed' ? 'Marketing consent recorded. No email was sent.' : 'You have unsubscribed from marketing emails.'); await loadEmailPreference(context);
  }, 'Email preferences could not be saved. Contact support for help.'));
})();

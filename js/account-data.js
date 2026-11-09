(() => {
  'use strict';
  const { auth, db } = MultiTools;
  const stamp = () => firebase.firestore.FieldValue.serverTimestamp();
  function requireUser(user) { if (!user || auth.currentUser !== user) throw new Error('Your account changed. Please try again.'); }
  const audit = (action, targetUid, details = {}) => ({ kind: 'administration', outcome: 'committed', action, actorUid: auth.currentUser.uid, targetUid, timestamp: stamp(), details });
  async function usernamesReady() {
    const snapshot = await db.collection('username_registry').doc('_policy').get({ source: 'server' });
    return snapshot.exists && snapshot.data().ready === true && snapshot.data().version === UsernamePolicy.version;
  }
  async function createProfile(username, marketingChoice = false, source = 'signup') {
    const user = auth.currentUser, error = UsernamePolicy.validate(username);
    if (!user) throw new Error('Sign in before completing your profile.');
    if (error) throw new Error(error);
    if (!await usernamesReady()) throw new Error('New username claims are paused until the reviewed username migration is complete. Existing accounts can still sign in with email.');
    requireUser(user);
    const display = username.trim(), key = UsernamePolicy.normalize(display);
    const profile = db.collection('users').doc(user.uid), registry = db.collection('username_registry').doc(key), pref = db.collection('email_preferences').doc(user.uid), log = db.collection('logs').doc();
    await db.runTransaction(async transaction => {
      const current = await transaction.get(profile), reservation = await transaction.get(registry), preference = await transaction.get(pref);
      const erasure = await transaction.get(db.collection('privacy_requests').doc(user.uid + '_erasure'));
      requireUser(user);
      if (current.exists) return;
      if (erasure.exists && !['rejected', 'cancelled'].includes(erasure.data().status)) throw new Error('Account deletion is awaiting completion. Open Settings to retry deletion or contact support.');
      if (reservation.exists && reservation.data().uid !== user.uid) throw new Error('That username is unavailable. Choose another to finish your existing account.');
      transaction.set(profile, { username: display, usernameKey: key, email: user.email, createdAt: stamp(), lastLoginAt: stamp(), emailVerified: user.emailVerified, role: 'user' });
      transaction.set(registry, { uid: user.uid, createdAt: reservation.exists ? reservation.data().createdAt : stamp() });
      if (!preference.exists) {
        const status = marketingChoice ? 'subscribed' : 'unknown';
        transaction.set(pref, { status, suppressed: false, address: String(user.email || '').trim().toLowerCase(), consentedAt: marketingChoice ? stamp() : null, unsubscribedAt: null, updatedAt: stamp(), updatedBy: user.uid, auditId: log.id, source, noticeVersion: MarketingPolicy.noticeVersion, choice: marketingChoice });
        transaction.set(log, audit('email_preference_changed', user.uid, { status }));
      }
    });
  }
  async function rename(username, uid = auth.currentUser?.uid) {
    const user = auth.currentUser;
    const error = UsernamePolicy.validate(username); if (error) throw new Error(error);
    if (!await usernamesReady()) throw new Error('Username changes are paused until the migration is complete.');
    requireUser(user);
    const display = username.trim(), key = UsernamePolicy.normalize(display), profile = db.collection('users').doc(uid), next = db.collection('username_registry').doc(key), log = db.collection('logs').doc();
    await db.runTransaction(async transaction => {
      const current = await transaction.get(profile), reservation = await transaction.get(next);
      if (!current.exists) throw new Error('Profile unavailable.');
      const oldKey = current.data().usernameKey, previous = oldKey && oldKey !== key ? db.collection('username_registry').doc(oldKey) : null;
      const old = previous ? await transaction.get(previous) : null;
      requireUser(user);
      if (reservation.exists && reservation.data().uid !== uid) throw new Error('That username is unavailable.');
      transaction.update(profile, { username: display, usernameKey: key, auditId: log.id });
      transaction.set(next, { uid, createdAt: reservation.exists ? reservation.data().createdAt : stamp() });
      if (previous && old?.data()?.uid === uid) transaction.delete(previous);
      transaction.set(log, audit('username_changed', uid));
    });
  }
  async function setMarketing(status, options = {}) {
    const uid = options.uid || auth.currentUser?.uid;
    if (!uid || !['subscribed', 'unsubscribed'].includes(status)) throw new Error('Invalid email preference.');
    const pref = db.collection('email_preferences').doc(uid), log = db.collection('logs').doc();
    const user = auth.currentUser;
    await db.runTransaction(async transaction => {
      const current = await transaction.get(pref), profile = await transaction.get(db.collection('users').doc(uid));
      requireUser(user);
      if (!profile.exists) throw new Error('Profile unavailable.');
      const previous = current.data() || {};
      const suppressed = options.suppressed === undefined ? previous.suppressed === true || previous.status === 'suppressed' : options.suppressed;
      if (suppressed && status === 'subscribed') throw new Error('Contact the owner to review suppression before subscribing.');
      const address = String(uid === user.uid ? user.email : profile.data().email || '').trim().toLowerCase();
      transaction.set(pref, { status, suppressed, address, consentedAt: status === 'subscribed' ? stamp() : previous.consentedAt || null, unsubscribedAt: status === 'unsubscribed' ? stamp() : null, updatedAt: stamp(), updatedBy: user.uid, auditId: log.id, source: options.source || (uid === user.uid ? 'settings' : 'admin'), noticeVersion: MarketingPolicy.noticeVersion, choice: status === 'subscribed' ? true : status === 'unknown' ? null : false });
      transaction.set(log, audit('email_preference_changed', uid, { status }));
    });
  }
  globalThis.AccountData = { usernamesReady, createProfile, rename, setMarketing };
})();

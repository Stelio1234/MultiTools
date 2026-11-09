(() => {
  'use strict';
  const { auth, db } = MultiTools;
  const types = ['access', 'correction', 'portability', 'erasure', 'restriction', 'objection', 'consent_withdrawal'];
  const steps = ['profile', 'preferences', 'usernameRegistry', 'auth', 'history', 'storage', 'connectedServices'];
  const stamp = () => firebase.firestore.FieldValue.serverTimestamp();
  function requireUser(user) { if (!user || auth.currentUser !== user) throw new Error('Your account changed. Please try again.'); }
  const event = (action, targetUid, requestId) => ({ kind: 'administration', outcome: 'committed', action, actorUid: auth.currentUser.uid, targetUid, timestamp: stamp(), details: { requestId } });
  function cleanup() { return Object.fromEntries(steps.map(key => [key, 'pending'])); }
  async function submit(type, details) {
    const user = auth.currentUser;
    if (!user || !types.includes(type)) throw new Error('Sign in and choose a supported request type.');
    const id = user.uid + '_' + type, ref = db.collection('privacy_requests').doc(id), log = db.collection('logs').doc();
    await db.runTransaction(async transaction => {
      const prior = await transaction.get(ref);
      requireUser(user);
      if (prior.exists && !['completed', 'rejected', 'cancelled'].includes(prior.data().status)) throw new Error('A request of this type is already open.');
      transaction.set(ref, { requesterUid: user.uid, type, details: String(details || '').trim().slice(0, 2000), submittedAt: stamp(), updatedAt: stamp(), updatedBy: user.uid, status: 'submitted', assignedTo: '', identityVerifiedAt: null, completedAt: null, resultNote: '', cleanup: cleanup(), auditId: log.id });
      transaction.set(log, event('privacy_request_submitted', user.uid, id));
    });
    return id;
  }
  async function listOwn() {
    const user = auth.currentUser; if (!user) throw new Error('Sign in again.');
    return db.collection('privacy_requests').where('requesterUid', '==', user.uid).limit(20).get({ source: 'server' });
  }
  async function list(status, cursor = null) {
    await MultiTools.requireStaff('managePrivacyRequests');
    let query = db.collection('privacy_requests'); if (status && status !== 'all') query = query.where('status', '==', status);
    if (cursor) query = query.startAfter(cursor);
    return query.limit(50).get({ source: 'server' });
  }
  async function update(id, changes) {
    const access = await MultiTools.requireStaff('managePrivacyRequests'), user = auth.currentUser, ref = db.collection('privacy_requests').doc(id), log = db.collection('logs').doc();
    await db.runTransaction(async transaction => {
      const current = await transaction.get(ref); if (!current.exists) throw new Error('Request unavailable.');
      requireUser(user);
      const value = current.data();
      transaction.update(ref, { status: changes.status, assignedTo: access.uid, resultNote: changes.resultNote.slice(0, 1000), identityVerifiedAt: value.identityVerifiedAt || (changes.identityVerified ? stamp() : null), completedAt: changes.status === 'completed' ? value.completedAt || stamp() : null, cleanup: changes.cleanup, updatedAt: stamp(), updatedBy: access.uid, auditId: log.id });
      transaction.set(log, event('privacy_request_updated', value.requesterUid, id));
    });
  }
  async function deleteSelf() {
    const user = auth.currentUser;
    const id = user.uid + '_erasure', request = db.collection('privacy_requests').doc(id), profile = db.collection('users').doc(user.uid), pref = db.collection('email_preferences').doc(user.uid), log = db.collection('logs').doc();
    await db.runTransaction(async transaction => {
      const current = await transaction.get(profile), prior = await transaction.get(request);
      const key = current.data()?.usernameKey, registry = key ? db.collection('username_registry').doc(key) : null;
      const reservation = registry ? await transaction.get(registry) : null;
      requireUser(user);
      const progress = { ...cleanup(), profile: 'done', preferences: 'done', usernameRegistry: 'done', auth: 'operator_required', history: 'operator_required', storage: 'operator_required', connectedServices: 'operator_required' };
      const base = prior.exists ? prior.data() : { requesterUid: user.uid, type: 'erasure', details: 'Self-service account deletion; related systems require operator verification.', submittedAt: stamp(), assignedTo: '', identityVerifiedAt: null, completedAt: null, resultNote: '' };
      transaction.set(request, { ...base, completedAt: null, status: 'in_progress', cleanup: progress, updatedAt: stamp(), updatedBy: user.uid, auditId: log.id });
      if (current.exists) transaction.delete(profile); transaction.delete(pref);
      if (registry && reservation.data()?.uid === user.uid) transaction.delete(registry);
      transaction.set(log, event('privacy_self_cleanup', user.uid, id));
    });
    requireUser(user); await user.delete();
  }
  globalThis.PrivacyData = { types, steps, submit, listOwn, list, update, deleteSelf };
})();

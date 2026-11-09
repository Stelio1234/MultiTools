(() => {
  'use strict';
  const { auth, db, requireStaff } = MultiTools;
  const timestamp = () => firebase.firestore.FieldValue.serverTimestamp();
  const event = (action, targetUid, details = {}) => ({ kind: 'administration', outcome: 'committed', action, actorUid: auth.currentUser.uid, targetUid, timestamp: timestamp(), details });
  async function audit(action, targetUid = '', details = {}) {
    await requireStaff(action === 'email_exported' ? 'exportEmails' : undefined);
    return db.collection('logs').add(event(action, targetUid, details));
  }
  async function verifyIdentity(username, uid) {
    await requireStaff('owner');
    if (!uid || uid.includes('/') || UsernamePolicy.validate(username)) throw new Error('Enter a valid username and its Firebase UID.');
    const key = UsernamePolicy.normalize(username);
    const [profile, reservation] = await Promise.all([db.collection('users').doc(uid).get({ source: 'server' }), db.collection('username_registry').doc(key).get({ source: 'server' })]);
    if (!profile.exists || profile.data().usernameKey !== key || UsernamePolicy.normalize(profile.data().username) !== key || reservation.data()?.uid !== uid) throw new Error('Username and UID could not be verified as the same account. Complete the reviewed username migration first if this is a legacy profile.');
    return { ...profile.data(), id: uid, usernameKey: key };
  }
  async function saveRole(uid, permissions, active = true, options = {}) {
    const access = await requireStaff('owner');
    if (!uid || uid === access.uid) throw new Error('The permanent owner cannot be changed.');
    const profile = active ? await verifyIdentity(options.username, uid) : null;
    const ref = db.collection('admin_roles').doc(uid);
    const log = db.collection('logs').doc();
    await db.runTransaction(async transaction => {
      const current = await transaction.get(ref);
      if (active && !options.edit && current.data()?.active === true) throw new Error('This user is already an administrator. Edit the existing assignment instead.');
      transaction.set(ref, { active, permissions, usernameKey: profile?.usernameKey || current.data()?.usernameKey || '', createdAt: current.exists ? current.data().createdAt : timestamp(), updatedAt: timestamp(), updatedBy: access.uid, auditId: log.id });
      transaction.set(log, event(active ? 'administrator_saved' : 'administrator_removed', uid));
    });
  }
  async function setPreference(uid, status) {
    await requireStaff('manageEmailPreferences');
    if (!['unsubscribed', 'suppressed'].includes(status)) throw new Error('Only the user can grant marketing consent.');
    return AccountData.setMarketing('unsubscribed', { uid, source: 'admin', suppressed: status === 'suppressed' });
  }
  async function saveSettings(pageSize, defaultExportScope) {
    const access = await requireStaff('owner');
    const log = db.collection('logs').doc(), batch = db.batch();
    batch.set(db.collection('admin_settings').doc('workspace'), { pageSize, defaultExportScope, updatedAt: timestamp(), updatedBy: access.uid, auditId: log.id });
    batch.set(log, event('workspace_settings_changed', 'workspace'));
    await batch.commit();
  }
  async function count(collectionId, filters = []) {
    await requireStaff(collectionId === 'admin_roles' ? 'owner' : collectionId === 'logs' ? 'viewSecurity' : 'readUsers');
    const structuredQuery = { from: [{ collectionId }], limit: 100 };
    if (filters.length) {
      const clauses = filters.map(([fieldPath, op, value]) => ({ fieldFilter: { field: { fieldPath }, op, value } }));
      structuredQuery.where = clauses.length === 1 ? clauses[0] : { compositeFilter: { op: 'AND', filters: clauses } };
    }
    const origin = db.app.options.projectId === 'demo-multitools' ? 'http://127.0.0.1:8080' : 'https://firestore.googleapis.com';
    const response = await fetch(`${origin}/v1/projects/${db.app.options.projectId}/databases/(default)/documents:runAggregationQuery`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await auth.currentUser.getIdToken()}` },
      body: JSON.stringify({ structuredAggregationQuery: { structuredQuery, aggregations: [{ alias: 'total', count: {} }] } }), signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) throw new Error('Count unavailable.');
    const data = await response.json(), value = Number(data[0]?.result?.aggregateFields?.total?.integerValue);
    if (!Number.isSafeInteger(value) || value < 0) throw new Error('Count unavailable.');
    return { value, capped: value >= 100 };
  }
  globalThis.AdminService = { audit, verifyIdentity, saveRole, setPreference, saveSettings, count };
})();

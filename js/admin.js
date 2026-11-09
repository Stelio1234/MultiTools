(() => {
  'use strict';
  const { auth, db, ready, requireStaff, getAdminAccess, getOwner } = MultiTools;
  const D = AdminData, S = AdminService, get = id => document.getElementById(id);
  const titles = { overview: 'Overview', users: 'Users', administrators: 'Administrators', email: 'Email Management', security: 'Security Activity', website: 'Website Management', privacy: 'Privacy Requests', settings: 'Settings' };
  const required = { users: 'readUsers', email: 'exportEmails', security: 'viewSecurity', privacy: 'managePrivacyRequests' };
  const permissionNames = { readUsers: 'User profiles', exportEmails: 'Email exports', manageEmailPreferences: 'Email preferences', viewSecurity: 'Security activity', managePrivacyRequests: 'Privacy requests' };
  const state = { access: null, ownerUid: null, epoch: 0, section: 'overview', pageSize: 25, users: [], userStarts: [null], userPage: 0, userNext: null, userMore: false, userRequest: 0, roleCursor: null, activityCursor: null, selected: null, exportRows: [], exportFilters: null, exportPage: 0, exportRun: 0, exporting: false, initialized: new Set() };
  let unsubscribeRole, redirecting = false, verifiedRoleIdentity = null, roleEdit = false, selectedRequest = null, roleAttempt = 0, roleSaving = false, privacyRequest = 0, privacySaving = false, roleRequest = 0, activityRequest = 0, detailsRequest = 0;
  const node = (tag, text, className) => { const element = document.createElement(tag); if (text !== undefined) element.textContent = String(text); if (className) element.className = className; return element; };
  const date = value => D.asDate(value)?.toLocaleString() || 'Unavailable';
  const tag = (text, kind = '') => node('span', text, 'status-tag ' + kind);
  function message(text, type = 'success') { get('admin-message').textContent = text; get('admin-message').dataset.type = type; get('admin-message').hidden = !text; }
  function current(epoch) { if (!state.access || state.epoch !== epoch || auth.currentUser?.uid !== state.access.uid) throw new Error('Access changed. Please sign in again.'); }
  function redirect(path) { if (!redirecting) { redirecting = true; location.replace(path); } }
  function clearPrivate() {
    state.epoch++; state.exportRun++; state.exporting = false; state.access = null; state.users = []; state.selected = null; state.exportRows = []; state.exportFilters = null; state.userStarts = [null]; state.userPage = 0; state.roleCursor = null; state.activityCursor = null; state.initialized.clear();
    roleAttempt++; privacyRequest++; verifiedRoleIdentity = null; privacyCursor = null;
    get('admin-content').hidden = true; get('admin-status').hidden = false;
    selectedRequest = null;
    for (const id of ['role-username', 'role-user-uid', 'privacy-result']) get(id).value = '';
    for (const id of ['users-body', 'recent-users-body', 'recent-events', 'administrators-body', 'email-preview-body', 'activity-body', 'privacy-body', 'admin-account', 'user-details', 'privacy-request-details', 'privacy-cleanup']) get(id).replaceChildren();
    document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
    get('sidebar-email').textContent = ''; get('download-export').disabled = true;
    message('');
    for (const id of ['user-dialog-title', 'role-user-name', 'role-form-status', 'privacy-assignment', 'privacy-update-status']) get(id).textContent = '';
    for (const id of ['profile-total', 'recent-total', 'verified-total', 'unverified-total', 'subscriber-total', 'administrator-total', 'event-total']) get(id).textContent = 'Unavailable';
    for (const id of ['user-search', 'email-search']) get(id).value = '';
    get('email-source-stats').textContent = 'Prepare a new preview to review source coverage.';
  }
  async function task(action) {
    const user = auth.currentUser;
    try { await action(); }
    catch (error) {
      if (auth.currentUser !== user) return;
      if (state.access) message(error.message || 'The operation could not be completed.', 'error');
      else { get('admin-status').hidden = false; get('admin-status').textContent = 'Administrator access is unavailable. Sign in again or contact the owner.'; }
    }
  }
  async function mapLimited(items, mapper) {
    const output = new Array(items.length); let index = 0;
    await Promise.all(Array.from({ length: Math.min(6, items.length) }, async () => {
      while (index < items.length) { const item = index++; output[item] = await mapper(items[item]); }
    })); return output;
  }
  async function enrich(profile, role = false) {
    const preference = await db.collection('email_preferences').doc(profile.id).get({ source: 'server' });
    let roleData;
    if (role && profile.id !== state.ownerUid) roleData = (await db.collection('admin_roles').doc(profile.id).get({ source: 'server' })).data();
    return { ...profile, preference: preference.data() || null, accessRole: profile.id === state.ownerUid ? 'Owner' : roleData?.active === true ? 'Administrator' : 'User', roleData };
  }
  function profileFilters() { return { search: get('user-search').value, verification: get('user-verification').value }; }
  function userQuery(cursor, sort) {
    let query = db.collection('users');
    if (sort === 'uid') query = query.orderBy(firebase.firestore.FieldPath.documentId());
    else query = query.orderBy('createdAt', sort === 'oldest' ? 'asc' : 'desc');
    return (cursor ? query.startAfter(cursor) : query).limit(50);
  }
  async function users(reset = false, targetPage = state.userPage) {
    const epoch = state.epoch, request = ++state.userRequest, page = reset ? 0 : targetPage, sort = get('user-sort').value, filters = profileFilters();
    if (reset) state.userStarts = [null];
    get('more-users').disabled = true; get('previous-users').disabled = true; get('users-status').textContent = 'Searching profiles...';
    try {
    await requireStaff('readUsers'); current(epoch); if (request !== state.userRequest) return;
    const matches = []; let cursor = state.userStarts[page], scanned = 0, more = true;
    while (matches.length < state.pageSize && scanned < 200 && more) {
      await requireStaff('readUsers'); current(epoch);
      const result = await userQuery(cursor, sort).get({ source: 'server' }); current(epoch);
      if (request !== state.userRequest) return;
      if (result.empty) { more = false; break; }
      for (let index = 0; index < result.docs.length; index++) {
        const doc = result.docs[index]; cursor = doc; scanned++;
        const profile = { ...doc.data(), id: doc.id };
        if (D.matches(profile, filters)) matches.push(profile);
        more = index < result.docs.length - 1 || result.size === 50;
        if (matches.length === state.pageSize || scanned === 200) break;
      }
    }
    const rows = await mapLimited(matches, profile => enrich(profile, true)); current(epoch);
    if (request !== state.userRequest) return;
    state.userPage = page; state.users = rows; state.userNext = cursor; state.userMore = more;
    get('users-body').replaceChildren(...rows.map(profile => {
      const row = node('tr'); const name = node('td', D.name(profile)); name.append(node('span', profile.id, 'subtext'));
      row.append(name, node('td', profile.email || 'Unavailable'), node('td', date(profile.createdAt)));
      const verification = node('td'); verification.append(tag(profile.emailVerified === true ? 'Verified' : profile.emailVerified === false ? 'Unverified' : 'Unknown', profile.emailVerified === true ? 'positive' : ''));
      row.append(verification, node('td', 'Console only'), node('td', profile.accessRole));
      const actions = node('td'), button = node('button', 'Details', 'row-action'); button.type = 'button'; button.addEventListener('click', () => task(() => showUser(profile.id))); actions.append(button); row.append(actions); return row;
    }));
    if (!rows.length) { const row = node('tr'), cell = node('td', more ? 'No matches in this batch. Next continues the search.' : 'No matching profiles.'); cell.colSpan = 7; row.append(cell); get('users-body').append(row); }
    get('users-status').textContent = `${rows.length} results; ${scanned} profiles checked${more ? '; more profiles remain' : '; end of results'}.`;
    get('users-page-info').textContent = `Page ${state.userPage + 1}`; get('previous-users').disabled = state.userPage === 0; get('more-users').disabled = !more;
    } catch (error) { if (state.epoch === epoch && request === state.userRequest) { get('users-body').replaceChildren(); get('users-status').textContent = 'Profiles unavailable. Apply filters or refresh to retry.'; } throw error; }
  }
  async function showUser(uid) {
    const epoch = state.epoch, request = ++detailsRequest; await requireStaff('readUsers'); current(epoch);
    const result = await db.collection('users').doc(uid).get({ source: 'server' }); if (!result.exists) throw new Error('This profile no longer exists.');
    const profile = await enrich({ ...result.data(), id: uid }, true); current(epoch); if (request !== detailsRequest) return; state.selected = profile;
    get('user-dialog-title').textContent = D.name(profile);
    get('user-details').replaceChildren();
    for (const [label, value] of [['UID', uid], ['Email', profile.email || 'Unavailable'], ['Name', D.name(profile)], ['First name', profile.firstName || 'Not recorded'], ['Last name', profile.lastName || 'Not recorded'], ['Registration', date(profile.createdAt)], ['Last sign-in sync', date(profile.lastLoginAt)], ['Email verification', profile.emailVerified === true ? 'Verified at last sync' : profile.emailVerified === false ? 'Unverified at last sync' : 'Unknown'], ['Auth account status', 'Managed in Firebase Console'], ['Role', profile.accessRole], ['Marketing subscription', D.preference(profile.preference)], ['Consent date', date(profile.preference?.consentedAt)], ['Unsubscribe date', date(profile.preference?.unsubscribedAt)]]) get('user-details').append(node('dt', label), node('dd', value));
    get('user-preference-controls').hidden = state.access.permissions.manageEmailPreferences !== true || (uid === state.ownerUid && !state.access.owner);
    get('manage-user-access').hidden = !state.access.owner || uid === state.ownerUid;
    get('unsubscribe-user').textContent = D.preference(profile.preference) === 'suppressed' ? 'Clear suppression; keep unsubscribed' : 'Record unsubscribe';
    get('user-dialog').showModal();
  }
  function roleDialog(profile) {
    if (!state.access.owner || roleSaving) return;
    roleAttempt++; get('verify-role-identity').disabled = false;
    get('role-user-uid').value = profile?.id || ''; get('role-user-uid').readOnly = Boolean(profile);
    get('role-username').value = profile?.username || ''; get('role-username').readOnly = Boolean(profile);
    verifiedRoleIdentity = null; roleEdit = profile?.roleData?.active === true;
    get('save-administrator').disabled = true;
    get('role-user-name').textContent = 'Verify the username and UID, then confirm the displayed account.';
    for (const permission of D.permissions) get('permission-' + permission).checked = profile?.roleData?.active ? profile.roleData.permissions[permission] === true : ['readUsers', 'viewSecurity'].includes(permission);
    get('role-form-status').textContent = ''; get('role-dialog').showModal();
  }
  async function administrators(reset = true) {
    const epoch = state.epoch, request = ++roleRequest; get('more-administrators').disabled = true;
    await requireStaff('owner'); current(epoch); if (request !== roleRequest) return;
    if (reset) state.roleCursor = null;
    let query = db.collection('admin_roles').orderBy(firebase.firestore.FieldPath.documentId()).limit(50);
    if (state.roleCursor) query = query.startAfter(state.roleCursor);
    const result = await query.get({ source: 'server' });
    const records = await mapLimited(result.docs, async doc => {
      const profile = await db.collection('users').doc(doc.id).get({ source: 'server' }); return { ...profile.data(), id: doc.id, roleData: doc.data() };
    }); current(epoch); if (request !== roleRequest) return; state.roleCursor = result.docs.at(-1) || null;
    get('administrators-body').replaceChildren(...records.map(profile => {
      const row = node('tr'), user = node('td', D.name(profile)); user.append(node('span', profile.email || profile.id, 'subtext'));
      const permissions = D.permissions.filter(key => profile.roleData.permissions?.[key]).map(key => permissionNames[key]);
      row.append(user, node('td', profile.roleData.active ? permissions.join(', ') || 'Dashboard access only' : 'Access removed'), node('td', date(profile.roleData.updatedAt)));
      const actions = node('td'), edit = node('button', profile.roleData.active ? 'Edit permissions' : 'Restore access', 'row-action'); edit.type = 'button'; edit.addEventListener('click', () => roleDialog(profile)); actions.append(edit);
      if (profile.roleData.active) { const remove = node('button', 'Remove access', 'row-action btn-danger'); remove.type = 'button'; remove.addEventListener('click', () => task(async () => {
        if (!confirm(`Remove administrator access for ${D.name(profile)}?`)) return;
        await S.saveRole(profile.id, Object.fromEntries(D.permissions.map(key => [key, false])), false); state.initialized.delete('overview'); state.initialized.delete('users'); message('Administrator access removed.'); await administrators();
      })); actions.append(remove); }
      row.append(actions); return row;
    }));
    get('administrators-status').textContent = result.empty ? 'No additional administrator assignments.' : `${result.size} assignments shown. Removed assignments remain in the audit history.`;
    get('more-administrators').disabled = result.size < 50;
  }
  const eventName = data => ({ administrator_saved: 'Administrator access saved', administrator_removed: 'Administrator access removed', email_exported: 'Email CSV prepared', email_preference_changed: 'Email preference changed', workspace_settings_changed: 'Dashboard defaults changed', dashboard_opened: 'Dashboard opened', login_success: 'Sign-in reported', login_failure: 'Failed sign-in reported', logout: 'Sign-out reported' }[data.action || data.event] || String(data.action || data.event || data.tool || data.path || 'Historical record').slice(0, 120));
  async function activity(reset = true) {
    const epoch = state.epoch, request = ++activityRequest, source = get('activity-source').value; get('more-activity').disabled = true;
    await requireStaff('viewSecurity'); current(epoch); if (request !== activityRequest) return;
    if (!['logs', 'tool_counts', 'tool_usage', 'page_views', 'session_logs', 'error_logs'].includes(source)) return;
    if (reset) state.activityCursor = null;
    let query = db.collection(source).orderBy(source === 'tool_counts' ? 'count' : 'timestamp', 'desc').limit(25);
    if (state.activityCursor) query = query.startAfter(state.activityCursor);
    const result = await query.get({ source: 'server' }); current(epoch); if (request !== activityRequest || get('activity-source').value !== source) return;
    state.activityCursor = result.docs.at(-1) || null;
    get('activity-body').replaceChildren(...result.docs.map(doc => {
      const data = doc.data(), row = node('tr');
      row.append(node('td', date(data.timestamp || data.lastOpenedAt)), node('td', source === 'tool_counts' ? String(data.name || 'Tool opens') : eventName(data)), node('td', data.actorUid || data.uid || data.userId || 'Unavailable'), node('td', data.targetUid || '-'), node('td', source === 'tool_counts' ? `${data.count} recorded opens` : data.details?.count ? `${data.details.count} addresses; ${data.details.scope}` : data.details?.status || (data.kind === 'administration' ? 'Protected audit record' : 'Browser-reported / historical'))); return row;
    }));
    get('activity-status').textContent = result.empty ? 'No activity found in this source.' : `${result.size} records shown. Legacy timestamps may use different formats.`;
    get('more-activity').disabled = result.size < 25;
  }
  async function overview() {
    const epoch = state.epoch, month = new Date(); month.setDate(1); month.setHours(0, 0, 0, 0);
    for (const [id, collectionId, filters, ownerOnly] of [
      ['profile-total', 'users', []], ['recent-total', 'users', [['createdAt', 'GREATER_THAN_OR_EQUAL', { timestampValue: month.toISOString() }]]],
      ['verified-total', 'users', [['emailVerified', 'EQUAL', { booleanValue: true }]]], ['unverified-total', 'users', [['emailVerified', 'EQUAL', { booleanValue: false }]]],
      ['subscriber-total', 'email_preferences', [['status', 'EQUAL', { stringValue: 'subscribed' }]]], ['administrator-total', 'admin_roles', [['active', 'EQUAL', { booleanValue: true }]], true], ['event-total', 'logs', []]
    ]) {
      try {
        if (ownerOnly && !state.access.owner) throw new Error();
        const count = await S.count(collectionId, filters); current(epoch);
        get(id).textContent = `${count.value + (ownerOnly ? 1 : 0)}${count.capped ? '+' : ''}`; get(id).classList.remove('unavailable');
      } catch { if (state.epoch === epoch) { get(id).textContent = 'Unavailable'; get(id).classList.add('unavailable'); } }
    }
    if (state.access?.permissions.readUsers) {
      try {
        await requireStaff('readUsers'); const recent = await db.collection('users').orderBy('createdAt', 'desc').limit(5).get({ source: 'server' }); current(epoch);
        get('recent-users-body').replaceChildren(...recent.docs.map(doc => { const data = doc.data(), row = node('tr'); row.append(node('td', D.name(data)), node('td', data.email || 'Unavailable'), node('td', date(data.createdAt))); return row; }));
        get('recent-users-status').hidden = !recent.empty; get('recent-users-status').textContent = 'No dated profiles available.';
      } catch { if (state.epoch === epoch) get('recent-users-status').textContent = 'Recent registrations unavailable.'; }
    } else get('recent-users-status').textContent = 'Your role does not include user records.';
    if (state.access?.permissions.viewSecurity) {
      try {
        await requireStaff('viewSecurity'); const events = await db.collection('logs').orderBy('timestamp', 'desc').limit(5).get({ source: 'server' }); current(epoch);
        get('recent-events').replaceChildren(...events.docs.map(doc => { const data = doc.data(), item = node('li'); item.append(node('p', eventName(data)), node('small', `${date(data.timestamp)} - ${data.actorUid || data.uid || data.userId || 'Unknown actor'}`)); return item; }));
        get('recent-events-status').hidden = !events.empty; get('recent-events-status').textContent = 'No security activity yet.';
      } catch { if (state.epoch === epoch) get('recent-events-status').textContent = 'Security activity unavailable.'; }
    } else get('recent-events-status').textContent = 'Your role does not include security records.';
  }
  function readExportFilters() {
    const filters = { scope: get('email-scope').value, search: get('email-search').value, from: get('email-from').value, to: get('email-to').value, consent: get('email-consent').value };
    if (!['all', 'verified', 'marketing', 'date'].includes(filters.scope)) throw new Error('Choose an export list.');
    if (filters.scope === 'date' && !filters.from && !filters.to) throw new Error('Choose at least one registration-date boundary.');
    if (filters.from && filters.to && filters.from > filters.to) throw new Error('The start date must be on or before the end date.');
    if (filters.scope === 'marketing' && !['any', 'subscribed'].includes(filters.consent)) throw new Error('Marketing exports require subscribed users.');
    return filters;
  }
  function renderPreview() {
    const start = state.exportPage * 10, rows = state.exportRows.slice(start, start + 10);
    get('email-preview-body').replaceChildren(...rows.map(record => { const row = node('tr'); for (const value of [record.email, record.firstName || '-', record.lastName || '-', record.registeredAt || 'Unknown', record.verified, record.consent]) row.append(node('td', value)); return row; }));
    get('export-count').textContent = `${state.exportRows.length} unique exportable addresses.`;
    get('preview-page-info').textContent = state.exportRows.length ? `${start + 1}-${Math.min(start + 10, state.exportRows.length)} of ${state.exportRows.length}` : 'No matching addresses';
    get('previous-preview').disabled = state.exportPage === 0; get('next-preview').disabled = start + 10 >= state.exportRows.length;
    get('download-export').disabled = !state.exportRows.length || state.exporting || (state.exportFilters?.scope === 'marketing' && !MarketingPolicy.marketingEnabled);
    get('download-export').title = state.exportFilters?.scope === 'marketing' && !MarketingPolicy.marketingEnabled ? 'An approved sender and secure logged-out unsubscribe are required before marketing downloads.' : '';
  }
  function exportCurrent(operation) {
    current(operation.epoch);
    if (operation.run !== state.exportRun) throw new Error('Export cancelled. Prepare a new preview.');
  }
  function beginExport() {
    const operation = { epoch: state.epoch, run: ++state.exportRun }; state.exporting = true;
    get('cancel-export').hidden = false; get('prepare-export').disabled = true; get('download-export').disabled = true;
    return operation;
  }
  function endExport(operation) {
    if (state.epoch !== operation.epoch) return;
    state.exporting = false; get('cancel-export').hidden = true; get('prepare-export').disabled = false; renderPreview();
  }
  async function scanExport(filters, operation) {
    await requireStaff('exportEmails'); exportCurrent(operation);
    const records = []; let cursor, done = false, scanned = 0;
    while (!done) {
      await requireStaff('exportEmails'); exportCurrent(operation);
      let query = db.collection('users');
      if (filters.scope !== 'marketing' && (filters.from || filters.to)) {
        if (filters.from) query = query.where('createdAt', '>=', new Date(filters.from + 'T00:00:00Z'));
        if (filters.to) query = query.where('createdAt', '<', new Date(new Date(filters.to + 'T00:00:00Z').getTime() + 86400000));
        query = query.orderBy('createdAt');
      } else {
        if (filters.scope === 'verified') query = query.where('emailVerified', '==', true);
        query = query.orderBy(firebase.firestore.FieldPath.documentId());
      }
      query = query.limit(100); if (cursor) query = query.startAfter(cursor);
      const result = await query.get({ source: 'server' }); exportCurrent(operation);
      const batch = await mapLimited(result.docs, async doc => {
        const profile = doc.data(), pref = await db.collection('email_preferences').doc(doc.id).get({ source: 'server' });
        return { id: doc.id, email: profile.email, username: profile.username, displayName: profile.displayName, firstName: profile.firstName, lastName: profile.lastName, createdAt: profile.createdAt, emailVerified: profile.emailVerified, preference: pref.data() || null };
      }); exportCurrent(operation);
      records.push(...batch); scanned += result.size; cursor = result.docs.at(-1); done = result.size < 100;
      get('export-progress').textContent = `${scanned} profiles reviewed...`;
      if (scanned >= 50000 && !done) throw new Error('This browser export reached its 50,000-profile safety limit. No partial file was produced.');
    }
    const summary = { subscribed: 0, unsubscribed: 0, unknown: 0, verified: 0, unverified: 0 };
    for (const record of records) { summary[MarketingPolicy.status(record.preference)]++; if (record.emailVerified === true) summary.verified++; else if (record.emailVerified === false) summary.unverified++; }
    get('email-source-stats').textContent = `Reviewed source: ${records.length} profiles; ${summary.subscribed} subscribed, ${summary.unsubscribed} unsubscribed, ${summary.unknown} unknown; ${summary.verified} verified and ${summary.unverified} unverified. Auth-only accounts are not included.`;
    return D.exportRecords(records, filters);
  }
  async function prepareExport() {
    if (state.exporting) return;
    const filters = readExportFilters(), operation = beginExport(); state.exportRows = []; state.exportFilters = null; renderPreview();
    get('export-progress').textContent = 'Preparing preview...';
    try {
      const rows = await scanExport(filters, operation); await requireStaff('exportEmails'); exportCurrent(operation);
      state.exportRows = rows; state.exportFilters = filters; state.exportPage = 0; get('export-progress').textContent = 'Preview ready. No email has been sent.';
      message(rows.length ? 'Email preview prepared. Review the selection before downloading.' : 'No addresses match this selection.');
    } finally { endExport(operation); }
  }
  async function downloadExport() {
    if (!state.exportFilters || !state.exportRows.length || state.exporting) return;
    if (state.exportFilters.scope === 'marketing' && !MarketingPolicy.marketingEnabled) throw new Error('Marketing downloads are unavailable until an approved sender and secure logged-out unsubscribe service are configured. Preview and restricted administrative exports remain available.');
    const filters = state.exportFilters, preview = state.exportRows, format = get('email-format').value, operation = beginExport();
    try {
      get('export-progress').textContent = 'Rechecking current consent and profile data...';
      const fresh = await scanExport(filters, operation); exportCurrent(operation);
      if (JSON.stringify(fresh) !== JSON.stringify(preview)) {
        state.exportRows = fresh; state.exportPage = 0; get('export-progress').textContent = 'The list changed since preparation.';
        message('The list changed. Review the updated preview, then download again.'); return;
      }
      await S.audit('email_exported', '', { count: fresh.length, scope: filters.scope, format, from: filters.from, to: filters.to }); exportCurrent(operation);
      await requireStaff('exportEmails'); exportCurrent(operation);
      const blob = new Blob([D.csv(fresh, format === 'excel')], { type: 'text/csv;charset=utf-8' }), url = URL.createObjectURL(blob), link = node('a');
      link.href = url; link.download = `multitools-${filters.scope}-emails-${new Date().toISOString().slice(0, 10)}.csv`; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      get('export-progress').textContent = 'CSV prepared and audit event recorded.'; message('CSV download started.');
    } finally { endExport(operation); }
  }
  async function website() {
    const epoch = state.epoch;
    try {
      const response = await fetch('/sitemap.xml', { cache: 'no-store' }); if (!response.ok) throw new Error();
      const xml = new DOMParser().parseFromString(await response.text(), 'application/xml'); current(epoch);
      get('website-pages').replaceChildren(...Array.from(xml.querySelectorAll('loc')).map(element => {
        const url = new URL(element.textContent); if (url.origin !== 'https://www.themultitools.xyz') return null;
        const row = node('tr'), name = node('td', url.pathname === '/' ? 'Home' : decodeURIComponent(url.pathname.split('/').at(-1))), cell = node('td'), link = node('a', url.href); link.href = url.href; link.target = '_blank'; link.rel = 'noopener noreferrer'; cell.append(link); row.append(name, cell); return row;
      }).filter(Boolean));
    } catch { message('The public sitemap is unavailable.', 'error'); }
    try {
      if (!SiteConsent.allows('externalServices')) { get('website-status').textContent = 'Enable external services in Cookie Settings for live status.'; return; }
      const data = await SiteConsent.optionalJSON('externalServices', 'https://multitools.statuspage.io/api/v2/status.json', { signal: AbortSignal.timeout(8000) }); current(epoch); get('website-status').textContent = data.status?.description || 'Unavailable';
    } catch { if (state.epoch === epoch) get('website-status').textContent = 'Status service unavailable'; }
  }
  async function showSection(section, refresh = false) {
    if (!titles[section]) section = 'overview';
    if (!state.access) return;
    const epoch = state.epoch;
    if (required[section] && state.access.permissions[required[section]] !== true) { message('Your role does not include this section.', 'error'); section = 'overview'; }
    state.section = section;
    document.querySelectorAll('.admin-section').forEach(element => { element.hidden = element.id !== section; });
    document.querySelectorAll('#admin-nav a').forEach(link => { if (link.dataset.section === section) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current'); });
    get('admin-section-select').value = section; get('section-label').textContent = titles[section];
    if (state.initialized.has(section) && !refresh) return;
    if (section === 'overview') await overview();
    else if (section === 'users') await users(true);
    else if (section === 'administrators' && state.access.owner) await administrators();
    else if (section === 'security') await activity();
    else if (section === 'website') await website();
    else if (section === 'privacy') await privacyQueue();
    current(epoch); state.initialized.add(section);
  }
  let privacyCursor = null;
  async function privacyQueue(reset = true) {
    const request = ++privacyRequest, epoch = state.epoch, filter = get('privacy-filter').value;
    get('more-privacy').disabled = true; get('privacy-queue-status').textContent = 'Loading requests...';
    await requireStaff('managePrivacyRequests'); current(epoch); if (request !== privacyRequest) return;
    if (reset) privacyCursor = null;
    const result = await PrivacyData.list(filter, privacyCursor); current(epoch); if (request !== privacyRequest) return;
    privacyCursor = result.docs.at(-1) || null; get('more-privacy').disabled = result.size < 50;
    get('privacy-body').replaceChildren(...result.docs.map(doc => {
      const value = doc.data(), row = node('tr'), action = node('td'), button = node('button', 'Review', 'row-action');
      row.append(...[value.requesterUid, value.type.replaceAll('_', ' '), date(value.submittedAt), value.status, value.assignedTo || 'Unassigned', date(value.completedAt)].map(text => node('td', text)));
      button.type = 'button'; button.addEventListener('click', () => {
        if (privacySaving) return;
        get('privacy-update-form').querySelectorAll('input, select, textarea, button[type="submit"]').forEach(element => { element.disabled = false; });
        selectedRequest = { ...value, id: doc.id }; get('privacy-request-details').textContent = `${value.requesterUid} | ${value.type}: ${value.details || 'No additional details.'}`;
        get('privacy-assignment').textContent = `Handler: ${value.assignedTo || 'Unassigned'}`; get('privacy-result').value = value.resultNote || ''; get('privacy-update-status').textContent = '';
        get('privacy-identity').checked = Boolean(value.identityVerifiedAt); get('privacy-identity').disabled = Boolean(value.identityVerifiedAt);
        get('privacy-next-status').value = ['submitted', 'cancelled'].includes(value.status) ? 'in_review' : value.status;
        get('privacy-cleanup').hidden = value.type !== 'erasure'; get('privacy-cleanup').replaceChildren(node('legend', 'Erasure cleanup verification'));
        for (const step of PrivacyData.steps) {
          const labels = { auth: 'Firebase Authentication', usernameRegistry: 'Current username reservation', history: 'Historical records and old username aliases' };
          const label = node('label', labels[step] || step), select = node('select'); select.id = 'cleanup-' + step; label.htmlFor = select.id;
          for (const status of ['pending', 'operator_required', 'done', 'not_applicable']) { const option = node('option', status.replaceAll('_', ' ')); option.value = status; select.append(option); }
          select.value = value.cleanup[step]; get('privacy-cleanup').append(label, select);
        }
        get('privacy-dialog').showModal();
      }); action.append(button); row.append(action); return row;
    }));
    get('privacy-queue-status').textContent = `${result.size} requests shown (maximum 50). Select a status to narrow the queue.`;
  }
  get('refresh-privacy').addEventListener('click', () => task(privacyQueue)); get('privacy-filter').addEventListener('change', () => task(privacyQueue));
  get('more-privacy').addEventListener('click', () => task(() => privacyQueue(false)));
  get('privacy-update-form').addEventListener('submit', event => {
    event.preventDefault(); task(async () => {
      if (!selectedRequest || privacySaving) return;
      const epoch = state.epoch, id = selectedRequest.id;
      const changes = { status: get('privacy-next-status').value, resultNote: get('privacy-result').value, identityVerified: get('privacy-identity').checked, cleanup: Object.fromEntries(PrivacyData.steps.map(step => [step, get('cleanup-' + step).value])) };
      const fields = [...get('privacy-update-form').querySelectorAll('input, select, textarea, button[type="submit"]')].map(element => [element, element.disabled]);
      privacySaving = true; fields.forEach(([element]) => { element.disabled = true; });
      try {
        await PrivacyData.update(id, changes); current(epoch);
        if (selectedRequest?.id === id) get('privacy-dialog').close(); message('Request updated and audited. Fulfillment steps remain the handler’s responsibility.'); await privacyQueue();
      } catch (error) { if (state.epoch === epoch && selectedRequest?.id === id) get('privacy-update-status').textContent = error.message || 'Unable to update the request.'; }
      finally { privacySaving = false; if (state.epoch === epoch && selectedRequest?.id === id) fields.forEach(([element, disabled]) => { element.disabled = disabled; }); }
    });
  });
  function applyAccess(access) {
    state.access = access;
    document.querySelectorAll('[data-permission]').forEach(element => { const denied = access.permissions[element.dataset.permission] !== true; element.hidden = denied; if (element.tagName === 'OPTION') element.disabled = denied; });
    document.querySelectorAll('[data-owner-only]').forEach(element => { element.hidden = !access.owner; });
    get('administrator-readonly').hidden = access.owner;
    get('sidebar-role').textContent = access.owner ? 'Owner' : 'Administrator'; get('sidebar-email').textContent = auth.currentUser.email;
    get('session-label').textContent = `${access.owner ? 'Owner' : 'Administrator'} session active`;
  }
  async function start(user) {
    clearPrivate(); if (!user) { redirect('/login.html?next=admin'); return; }
    const epoch = state.epoch, access = await getAdminAccess(user);
    if (state.epoch !== epoch || auth.currentUser !== user) return;
    if (!access) { redirect('/settings.html'); return; }
    const ownerUid = await getOwner(); if (state.epoch !== epoch || auth.currentUser !== user) return;
    state.ownerUid = ownerUid; applyAccess(access);
    get('owner-uid').textContent = state.ownerUid; get('owner-identity').textContent = access.owner ? user.email : 'MultiTools owner';
    get('admin-account').replaceChildren();
    for (const [label, value] of [['Email', user.email], ['UID', user.uid], ['Access', access.owner ? 'Permanent owner' : 'Assigned administrator'], ['Email verification', user.emailVerified ? 'Verified' : 'Unverified']]) get('admin-account').append(node('dt', label), node('dd', value));
    try {
      const settings = (await db.collection('admin_settings').doc('workspace').get({ source: 'server' })).data(); current(epoch);
      state.pageSize = settings?.pageSize === 50 ? 50 : 25; get('default-page-size').value = String(state.pageSize);
      const scope = ['all', 'verified', 'marketing', 'date'].includes(settings?.defaultExportScope) ? settings.defaultExportScope : 'marketing'; get('email-scope').value = scope; get('default-export-scope').value = scope;
    } catch { if (state.epoch !== epoch) return; state.pageSize = 25; }
    get('admin-status').textContent = 'Administrator session active.'; get('admin-status').hidden = true; get('admin-content').hidden = false;
    unsubscribeRole?.();
    if (!access.owner) unsubscribeRole = db.collection('admin_roles').doc(user.uid).onSnapshot(snapshot => {
      if (state.epoch !== epoch || auth.currentUser !== user) return;
      if (!snapshot.exists || snapshot.data().active !== true) { clearPrivate(); redirect('/settings.html'); return; }
      if (JSON.stringify(snapshot.data().permissions) !== JSON.stringify(state.access?.permissions)) {
        clearPrivate(); task(() => start(user));
      }
    }, () => { if (state.epoch === epoch && auth.currentUser === user) { clearPrivate(); redirect('/settings.html'); } });
    await showSection(location.hash.slice(1) || 'overview', true); current(epoch);
    try { await S.audit('dashboard_opened', user.uid); } catch { message('The dashboard opened, but its access event could not be recorded.', 'error'); }
  }
  ready.then(() => auth.onAuthStateChanged(user => { unsubscribeRole?.(); task(() => start(user)); })).catch(() => { clearPrivate(); get('admin-status').textContent = 'Authentication unavailable. Please try again.'; });
  auth.onIdTokenChanged(user => { if (!user) clearPrivate(); });
  window.addEventListener('pagehide', clearPrivate); window.addEventListener('pageshow', event => { if (event.persisted) location.reload(); });
  window.addEventListener('hashchange', () => task(() => showSection(location.hash.slice(1))));
  get('admin-section-select').addEventListener('change', event => { location.hash = event.target.value; });
  get('refresh-section').addEventListener('click', () => task(() => showSection(state.section, true)));
  get('admin-logout').addEventListener('click', () => task(async () => { clearPrivate(); await auth.signOut(); }));
  get('user-filters').addEventListener('submit', event => { event.preventDefault(); task(() => users(true)); });
  get('more-users').addEventListener('click', () => task(async () => { if (!state.userMore || get('more-users').disabled) return; const page = state.userPage + 1; state.userStarts[page] = state.userNext; await users(false, page); }));
  get('previous-users').addEventListener('click', () => task(async () => { if (state.userPage && !get('previous-users').disabled) await users(false, state.userPage - 1); }));
  get('add-administrator').addEventListener('click', () => roleDialog());
  get('manage-user-access').addEventListener('click', () => { const profile = state.selected; get('user-dialog').close(); roleDialog(profile); });
  get('more-administrators').addEventListener('click', () => task(() => administrators(false)));
  for (const id of ['role-username', 'role-user-uid']) get(id).addEventListener('input', () => { roleAttempt++; verifiedRoleIdentity = null; get('save-administrator').disabled = true; get('role-form-status').textContent = ''; get('role-user-name').textContent = 'Verify the changed identity before granting access.'; });
  get('role-dialog').addEventListener('close', () => { roleAttempt++; verifiedRoleIdentity = null; get('save-administrator').disabled = true; });
  get('verify-role-identity').addEventListener('click', async () => {
    if (get('verify-role-identity').disabled || roleSaving) return;
    const username = get('role-username').value.trim(), uid = get('role-user-uid').value.trim(), epoch = state.epoch, attempt = ++roleAttempt;
    verifiedRoleIdentity = null; get('save-administrator').disabled = true; get('verify-role-identity').disabled = true; get('role-form-status').textContent = 'Verifying account...';
    try {
      const profile = await S.verifyIdentity(username, uid); current(epoch);
      if (attempt !== roleAttempt || !get('role-dialog').open) return;
      verifiedRoleIdentity = profile; get('role-form-status').textContent = '';
      get('role-user-name').textContent = `Verified: ${profile.username} | UID ${profile.id} | ${profile.email || 'Email unavailable'}. Confirm this account before saving.`;
      get('save-administrator').disabled = false;
    } catch (error) { if (state.epoch === epoch && attempt === roleAttempt && get('role-dialog').open) get('role-form-status').textContent = error.message || 'Account identity could not be verified.'; }
    finally { if (state.epoch === epoch) get('verify-role-identity').disabled = false; }
  });
  get('role-form').addEventListener('submit', event => { event.preventDefault(); task(async () => {
    if (roleSaving) return;
    const identity = verifiedRoleIdentity, epoch = state.epoch, attempt = roleAttempt, edit = roleEdit;
    const permissions = Object.fromEntries(D.permissions.map(permission => [permission, get('permission-' + permission).checked]));
    if (!identity || identity.id !== get('role-user-uid').value.trim() || identity.usernameKey !== UsernamePolicy.normalize(get('role-username').value)) { get('role-form-status').textContent = 'Verify both identity fields before saving.'; return; }
    if ((permissions.exportEmails || permissions.manageEmailPreferences || permissions.managePrivacyRequests) && !permissions.readUsers) { get('role-form-status').textContent = 'Export, subscription and privacy management require profile access.'; return; }
    const fields = [...get('role-form').querySelectorAll('input, button:not([data-close-dialog])')].map(element => [element, element.disabled]);
    roleSaving = true; fields.forEach(([element]) => { element.disabled = true; });
    try {
      await S.saveRole(identity.id, permissions, true, { username: identity.username, edit }); current(epoch);
      state.initialized.delete('overview'); state.initialized.delete('users');
      if (attempt === roleAttempt && get('role-dialog').open) get('role-dialog').close();
      message('Administrator access saved and audited.'); await administrators();
    } catch (error) { if (state.epoch === epoch && attempt === roleAttempt) get('role-form-status').textContent = error.message || 'Administrator access could not be saved.'; }
    finally { roleSaving = false; if (state.epoch === epoch) { fields.forEach(([element, disabled]) => { element.disabled = disabled; }); get('save-administrator').disabled = !verifiedRoleIdentity || !get('role-dialog').open; } }
  }); });
  for (const [id, status] of [['unsubscribe-user', 'unsubscribed'], ['suppress-user', 'suppressed']]) get(id).addEventListener('click', () => task(async () => {
    const uid = state.selected?.id; if (!uid || !confirm(`Record ${status} status for this user?`)) return;
    await S.setPreference(uid, status); state.initialized.delete('overview'); get('user-dialog').close(); message(`Email preference saved: ${status}.`); state.exportRows = []; state.exportFilters = null; renderPreview();
  }));
  get('email-filters').addEventListener('submit', event => { event.preventDefault(); task(prepareExport); });
  get('email-filters').addEventListener('input', event => { if (event.target.id === 'email-format') return; state.exportRun++; state.exportRows = []; state.exportFilters = null; renderPreview(); get('export-progress').textContent = 'Filters changed. Prepare a new preview.'; });
  get('cancel-export').addEventListener('click', () => { state.exportRun++; get('export-progress').textContent = 'Cancelling after the current batch...'; });
  get('download-export').addEventListener('click', () => task(downloadExport));
  get('previous-preview').addEventListener('click', () => { if (state.exportPage) state.exportPage--; renderPreview(); });
  get('next-preview').addEventListener('click', () => { if ((state.exportPage + 1) * 10 < state.exportRows.length) state.exportPage++; renderPreview(); });
  get('refresh-activity').addEventListener('click', () => task(() => activity())); get('activity-source').addEventListener('change', () => task(() => activity())); get('more-activity').addEventListener('click', () => task(() => activity(false)));
  let settingsSaving = false;
  get('workspace-settings').addEventListener('submit', event => { event.preventDefault(); task(async () => {
    if (settingsSaving) return;
    const epoch = state.epoch, pageSize = Number(get('default-page-size').value), scope = get('default-export-scope').value;
    const fields = [...get('workspace-settings').querySelectorAll('select, button')]; settingsSaving = true; fields.forEach(element => { element.disabled = true; });
    try { await S.saveSettings(pageSize, scope); current(epoch); state.pageSize = pageSize; state.initialized.delete('users'); message('Dashboard defaults saved and audited.'); }
    finally { settingsSaving = false; if (state.epoch === epoch) fields.forEach(element => { element.disabled = false; }); }
  }); });
  document.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click', () => get(button.dataset.closeDialog).close()));
  setInterval(async () => {
    if (!state.access) return; const epoch = state.epoch, user = auth.currentUser;
    try { await requireStaff(); }
    catch { if (state.epoch !== epoch || auth.currentUser !== user) return; clearPrivate(); await auth.signOut(); redirect('/login.html?next=admin'); }
  }, 30000);
})();

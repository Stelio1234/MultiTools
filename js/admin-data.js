(() => {
  'use strict';
  const permissions = ['readUsers', 'exportEmails', 'manageEmailPreferences', 'viewSecurity', 'managePrivacyRequests'];
  const marketing = typeof module !== 'undefined' && module.exports ? require('./marketing-policy.js') : MarketingPolicy;
  function asDate(value) {
    const result = typeof value?.toDate === 'function' ? value.toDate() : value instanceof Date ? value : typeof value === 'string' ? new Date(value) : null;
    return result && Number.isFinite(result.getTime()) ? result : null;
  }
  function preference(value) {
    if (value?.suppressed === true || value?.status === 'suppressed') return 'suppressed';
    return marketing.status(value);
  }
  function name(profile) {
    return [profile.displayName, profile.username, [profile.firstName, profile.lastName].filter(value => typeof value === 'string').join(' ')].find(value => typeof value === 'string' && value.trim())?.slice(0, 200) || 'Unnamed user';
  }
  function matches(profile, filters = {}, pref) {
    const term = (filters.search || '').trim().toLowerCase();
    if (term && ![profile.id, profile.email, profile.username, profile.displayName, name(profile), profile.firstName, profile.lastName].some(value => typeof value === 'string' && value.toLowerCase().includes(term))) return false;
    if (filters.verification === 'verified' && profile.emailVerified !== true) return false;
    if (filters.verification === 'unverified' && profile.emailVerified !== false) return false;
    if (filters.verification === 'unknown' && typeof profile.emailVerified === 'boolean') return false;
    const created = asDate(profile.createdAt);
    if (filters.from && (!created || created < new Date(filters.from + 'T00:00:00Z'))) return false;
    if (filters.to && (!created || created >= new Date(new Date(filters.to + 'T00:00:00Z').getTime() + 86400000))) return false;
    if (filters.consent && filters.consent !== 'any' && preference(pref) !== filters.consent) return false;
    if (filters.scope === 'verified' && profile.emailVerified !== true) return false;
    if (filters.scope === 'marketing' && !marketing.eligible(profile, pref)) return false;
    return true;
  }
  function validEmail(value) { return typeof value === 'string' && value.length <= 254 && /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(value); }
  function exportRecords(records, filters) {
    const blocked = new Set(records.filter(record => ['unsubscribed', 'suppressed'].includes(preference(record.preference))).flatMap(record => [record.email, record.preference?.address]).filter(Boolean).map(value => String(value).trim().toLowerCase()));
    const emails = new Set();
    return records.filter(record => {
      const email = String(record.email || '').trim().toLowerCase();
      if (!validEmail(record.email) || !matches(record, filters, record.preference) || emails.has(email)) return false;
      if (filters.scope === 'marketing' && blocked.has(email)) return false;
      emails.add(email); return true;
    }).map(record => ({
      email: record.email.trim(), firstName: typeof record.firstName === 'string' ? record.firstName : '',
      lastName: typeof record.lastName === 'string' ? record.lastName : '',
      registeredAt: asDate(record.createdAt)?.toISOString() || '',
      verified: record.emailVerified === true ? 'verified' : record.emailVerified === false ? 'unverified' : 'unknown',
      consent: preference(record.preference)
    }));
  }
  function csvCell(value) {
    let text = String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
    if (/^[\s\uFEFF]*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  }
  function csv(records, excel = false) {
    const header = ['Email', 'First name', 'Last name', 'Registration date', 'Email verification', 'Marketing consent'];
    const rows = records.map(record => [record.email, record.firstName, record.lastName, record.registeredAt, record.verified, record.consent]);
    return (excel ? '\uFEFF' : '') + [header, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
  }
  const api = { permissions, asDate, preference, name, matches, validEmail, exportRecords, csvCell, csv };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else globalThis.AdminData = api;
})();

(() => {
  'use strict';
  const noticeVersion = '2026-11-08';
  function asDate(value) {
    const date = typeof value?.toDate === 'function' ? value.toDate() : value instanceof Date ? value : typeof value === 'string' ? new Date(value) : null;
    return date && Number.isFinite(date.getTime()) ? date : null;
  }
  function status(record) {
    if (record?.status === 'suppressed' || record?.suppressed === true) return 'unsubscribed';
    if (record?.status === 'unsubscribed') return 'unsubscribed';
    if (record?.status === 'subscribed' && record.address && asDate(record.consentedAt) && !record.unsubscribedAt && record.noticeVersion && record.source) return 'subscribed';
    return 'unknown';
  }
  function eligible(profile, record) {
    return status(record) === 'subscribed' && profile.emailVerified === true && typeof profile.email === 'string'
      && record.address === profile.email.trim().toLowerCase() && record.suppressed !== true;
  }
  const api = { noticeVersion, status, eligible, senderConfigured: false, loggedOutUnsubscribeConfigured: false, marketingEnabled: false };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else globalThis.MarketingPolicy = api;
})();

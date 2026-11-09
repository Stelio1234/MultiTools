(() => {
  'use strict';
  const version = '2026-11-08', key = 'multitools.cookie-preferences', maxAge = 180 * 86400000;
  let memory = null, memoryOnly = false, dialog, banner;
  const controllers = new Map();
  function read() {
    try {
      if (memoryOnly) return memory?.expiresAt > Date.now() ? memory : null;
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      if (value?.version === version && Number(value.expiresAt) > Date.now()) return value;
      return null;
    } catch { /* Choices remain available for this visit when browser storage is blocked. */ }
    return memory?.expiresAt > Date.now() ? memory : null;
  }
  function allows(category) { return read()?.[category] === true; }
  function save(analytics, externalServices) {
    memory = { version, analytics, externalServices, savedAt: Date.now(), expiresAt: Date.now() + maxAge };
    try { localStorage.setItem(key, JSON.stringify(memory)); memoryOnly = false; } catch { memoryOnly = true; }
    for (const [category, pending] of controllers) if (!allows(category)) for (const controller of pending) controller.abort();
    if (banner) banner.hidden = true;
    window.dispatchEvent(new CustomEvent('siteconsentchange', { detail: { analytics, externalServices } }));
  }
  async function optionalJSON(category, url, options = {}) {
    if (!allows(category)) throw new Error('Optional service is disabled in Cookie Settings.');
    const controller = new AbortController(), pending = controllers.get(category) || new Set();
    pending.add(controller); controllers.set(category, pending);
    try {
      const signal = options.signal ? AbortSignal.any([controller.signal, options.signal]) : controller.signal;
      const response = await fetch(url, { ...options, signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
      if (!response.ok) throw new Error('Optional service is unavailable.');
      const data = await response.json();
      if (!allows(category)) throw new Error('Optional service consent was withdrawn.');
      return data;
    } finally { pending.delete(controller); }
  }
  function open() {
    if (!dialog) return;
    document.getElementById('consent-analytics').checked = allows('analytics');
    document.getElementById('consent-services').checked = allows('externalServices');
    dialog.showModal();
  }
  globalThis.SiteConsent = { version, allows, read, open, optionalJSON };
  function init() {
    const wrapper = document.createElement('div');
    wrapper.className = 'site-consent';
    wrapper.innerHTML = '<section id="cookie-banner" class="cookie-banner" role="region" aria-labelledby="cookie-heading"><div><h2 id="cookie-heading">Your privacy choices</h2><p>Essential storage supports sign-in, security, timers, and these choices. Optional tool statistics and external services stay off until you choose. Cookie choices do not subscribe you to emails. <a href="/Templates/Other/privicypolicy.html">Privacy notice</a></p></div><div class="cookie-actions"><button type="button" id="cookie-accept">Accept All</button><button type="button" id="cookie-reject">Reject Optional</button><button type="button" id="cookie-settings">Cookie Settings</button></div></section><dialog id="cookie-dialog" aria-labelledby="cookie-dialog-heading"><h2 id="cookie-dialog-heading">Cookie Settings</h2><p>Essential storage is always enabled for requested features. These optional choices are saved for 180 days.</p><label><input type="checkbox" id="consent-analytics"> Tool statistics: record signed-in tool opens and load popular-tool counts.</label><label><input type="checkbox" id="consent-services"> External services: live status information and the No as a Service tool. These providers receive your network request.</label><div class="cookie-actions"><button type="button" id="cookie-save">Save choices</button><button type="button" id="cookie-dialog-reject">Reject Optional</button><button type="button" id="cookie-close">Close</button></div></dialog>';
    document.body.append(wrapper); banner = document.getElementById('cookie-banner'); dialog = document.getElementById('cookie-dialog');
    banner.hidden = Boolean(read());
    document.getElementById('cookie-accept').addEventListener('click', () => save(true, true));
    document.getElementById('cookie-reject').addEventListener('click', () => save(false, false));
    document.getElementById('cookie-settings').addEventListener('click', open);
    document.getElementById('cookie-save').addEventListener('click', () => { save(document.getElementById('consent-analytics').checked, document.getElementById('consent-services').checked); dialog.close(); });
    document.getElementById('cookie-dialog-reject').addEventListener('click', () => { save(false, false); dialog.close(); });
    document.getElementById('cookie-close').addEventListener('click', () => dialog.close());
    const footer = document.querySelector('footer') || document.body.appendChild(document.createElement('footer'));
    const control = document.createElement('button'); control.type = 'button'; control.className = 'cookie-reopen'; control.textContent = 'Cookie Settings'; control.addEventListener('click', open); footer.append(control);
  }
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) {
      memory = null; memoryOnly = false;
      if (banner) banner.hidden = Boolean(read());
      for (const [category, pending] of controllers) if (!allows(category)) for (const controller of pending) controller.abort();
      window.dispatchEvent(new CustomEvent('siteconsentchange'));
    }
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

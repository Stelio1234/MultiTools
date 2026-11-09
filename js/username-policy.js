(() => {
  'use strict';
  const reserved = new Set(['admin', 'administrator', 'support', 'owner', 'root', 'system', 'multitools', 'security']);
  function normalize(value) { return typeof value === 'string' ? value.trim().toLowerCase() : ''; }
  function validate(value) {
    if (typeof value !== 'string') return 'Enter a username.';
    const display = value.trim();
    if (!/^[A-Za-z0-9][A-Za-z0-9 _-]{1,30}[A-Za-z0-9]$/.test(display)) return 'Use 3-32 letters, numbers, spaces, underscores, or hyphens; start and end with a letter or number.';
    if (reserved.has(normalize(display))) return 'Choose a different username; this name is reserved.';
    return null;
  }
  const api = { normalize, validate, version: 'ascii-v1', reserved: [...reserved] };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else globalThis.UsernamePolicy = api;
})();

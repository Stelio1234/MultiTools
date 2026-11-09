async function loadStatus() {
    const badge = document.getElementById('status-text');
    if (!SiteConsent.allows('externalServices')) { badge.textContent = 'Check status'; delete badge.dataset.status; return; }

    const url = "https://multitools.statuspage.io/api/v2/status.json";

    const data = await SiteConsent.optionalJSON('externalServices', url, { signal: AbortSignal.timeout(8000) });

    const indicator = data.status.indicator;
    const description = data.status.description;

    badge.textContent = description.toLowerCase();

    badge.dataset.status = indicator;
}

loadStatus().catch(() => { document.getElementById("status-text").textContent = "Status unavailable"; });
window.addEventListener('siteconsentchange', () => loadStatus().catch(() => { document.getElementById('status-text').textContent = 'Check status'; }));

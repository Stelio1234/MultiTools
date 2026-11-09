const button = document.getElementById('fetchBtn');
    const outputDiv = document.getElementById('output');

    button.addEventListener('click', async () => {
      if (!SiteConsent.allows('externalServices')) { outputDiv.textContent = 'Enable external services in Cookie Settings to use this tool.'; SiteConsent.open(); return; }
      outputDiv.textContent = "Loading...";
      try {
        const data = await SiteConsent.optionalJSON('externalServices', 'https://naas.isalman.dev/no');
        if (!data.reason) throw new Error('No reason found in response');

        outputDiv.textContent = data.reason; // ONLY show the reason
      } catch (error) {
        outputDiv.textContent = 'Error: ' + error.message;
      }
    });
    window.addEventListener('siteconsentchange', () => { if (!SiteConsent.allows('externalServices')) outputDiv.textContent = 'External services are disabled.'; });

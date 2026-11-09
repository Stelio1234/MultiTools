let iconBase64 = '';

    document.getElementById('iconInput').addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (!file) return;

        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) return alert('Choose a PNG, JPEG, or WebP image no larger than 2 MB.');
        const reader = new FileReader();
        reader.onload = function (event) {
            iconBase64 = event.target.result;
            // Show the preview container and set image src
            const previewContainer = document.getElementById('preview-container');
            const previewImage = document.getElementById('preview');
            previewImage.src = iconBase64;
            previewContainer.style.display = 'inline-block';
        };
        reader.readAsDataURL(file);
    });

    function deleteIcon() {
        iconBase64 = '';
        document.getElementById('iconInput').value = '';
        document.getElementById('preview-container').style.display = 'none';
        document.getElementById('preview').src = '';
    }

    function generateUUID() { return crypto.randomUUID(); }

    function toggleRemovalDate() { document.getElementById('removalDateInput').style.display = document.getElementById('removalDateCheckbox').checked ? 'block' : 'none'; }

    function generateWebClip() {
        const displayName = document.getElementById('displayNameInput').value.trim();
        const description = document.getElementById('descriptionInput').value.trim();
        const linkInputRaw = document.getElementById('linkInput').value.trim();
        const removalPasscode = document.getElementById('removalPasscode').value.trim();
        const removalDateCheckbox = document.getElementById('removalDateCheckbox').checked;
        const removalDate = document.getElementById('removalDateInput').value;
        const fullScreen = document.getElementById('fullscreenCheckbox').checked;
        const version = document.getElementById('versionInput').value;

        if (!displayName || !linkInputRaw || !iconBase64) {
            alert("Please provide Display Name, URL, and an icon image.");
            return;
        }

        let url;
        try {
            const parsed = new URL(linkInputRaw.includes('://') ? linkInputRaw : 'https://' + linkInputRaw);
            if (parsed.protocol !== 'https:' || parsed.username || parsed.password) throw new Error();
            url = parsed.href;
        } catch { return alert('Enter a valid HTTPS URL without embedded credentials.'); }
        if (!Number.isInteger(Number(version)) || Number(version) < 1 || Number(version) > 1000000) return alert('Enter a positive whole version number.');
        const escapeXML = value => String(value).replace(/[<>&"']/g, char => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[char]));
        document.getElementById('progressBar').style.display = 'block';
        const progressBar = document.getElementById('progress');
        progressBar.style.width = '20%';

        if (removalDateCheckbox && (!removalDate || !Number.isFinite(Date.parse(removalDate)))) return alert('Choose a valid removal date.');
        const randomUUID = generateUUID();
        const innerUUID = generateUUID();

        let removalDateTag = '';
        if (removalDateCheckbox && removalDate) {
            removalDateTag = `<key>PayloadRemovalDate</key><date>${new Date(removalDate).toISOString()}</date>`;
        }

        let passcodeTag = '';
        if (removalPasscode) {
            passcodeTag = `<key>PayloadRemovalPasscode</key><string>${escapeXML(removalPasscode)}</string>`;
        }

        let fullScreenTag = '';
        if (fullScreen) {
            fullScreenTag = `<key>FullScreen</key><true/>`;
        }

        progressBar.style.width = '50%';

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
<key>PayloadContent</key>
<array>
  <dict>
    <key>URL</key>
    <string>${escapeXML(url)}</string>
    <key>Icon</key>
    <data>${iconBase64.split(',')[1]}</data>
    <key>PayloadDisplayName</key>
    <string>${escapeXML(displayName)}</string>
    <key>PayloadDescription</key>
    <string>${escapeXML(description)}</string>
    <key>PayloadVersion</key>
    <integer>${version}</integer>
    ${passcodeTag}
    ${removalDateTag}
    ${fullScreenTag}
    <key>PayloadUUID</key>
    <string>${innerUUID}</string>
    <key>PayloadIdentifier</key>
    <string>com.example.webclip.${innerUUID}</string>
    <key>PayloadType</key>
    <string>com.apple.webClip.managed</string>
    <key>Label</key>
    <string>${escapeXML(displayName)}</string>
  </dict>
</array>
<key>PayloadType</key>
<string>Configuration</string>
<key>PayloadVersion</key>
<integer>1</integer>
<key>PayloadUUID</key>
<string>${randomUUID}</string>
<key>PayloadIdentifier</key>
<string>com.example.webclip.${randomUUID}</string>
<key>PayloadOrganization</key>
<string>MultiTools</string>
</dict>
</plist>`;

        progressBar.style.width = '80%';

        const blob = new Blob([xml], { type: 'application/x-apple-aspen-config' });
        const urlBlob = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = urlBlob;
        a.download = `${displayName}.mobileconfig`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(urlBlob), 1000);

        progressBar.style.width = '100%';
        setTimeout(() => {
            document.getElementById('progressBar').style.display = 'none';
            progressBar.style.width = '0';
        }, 1000);
    }

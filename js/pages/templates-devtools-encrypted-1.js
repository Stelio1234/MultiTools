function showSection(id) {
      document.getElementById('menu').style.display = 'none';
      document.getElementById(`${id}-container`).style.display = 'flex';
    }

    function goBack() {
      document.getElementById('menu').style.display = 'flex';
      document.getElementById('encrypt-container').style.display = 'none';
      document.getElementById('decrypt-container').style.display = 'none';
      document.querySelectorAll("input").forEach(input => input.value = "");
      document.getElementById("encryptResult").style.display = "none";
      document.getElementById("decryptResult").style.display = "none";
    }

    function showResult(result, label, output) {
      const code = document.createElement('code'); code.textContent = output;
      const button = document.createElement('button'); button.type = 'button'; button.className = 'copy-btn'; button.textContent = 'Copy';
      button.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(output); button.textContent = 'Copied!'; }
        catch { button.textContent = 'Select text to copy'; }
      });
      result.replaceChildren(document.createTextNode(label + ': '), code, document.createTextNode(' '), button);
      result.style.display = 'block';
    }
    function encrypt() {
      const text = document.getElementById('encryptText').value;
      if (!text) return alert('Enter text to encode');
      const bytes = new TextEncoder().encode(text);
      const output = btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(''));
      showResult(document.getElementById('encryptResult'), 'Encoded', output);
    }
    function decrypt() {
      const result = document.getElementById('decryptResult');
      try {
        const bytes = Uint8Array.from(atob(document.getElementById('decryptText').value.trim()), char => char.charCodeAt(0));
        const output = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
        showResult(result, 'Decoded', output);
      } catch { result.style.display = 'block'; result.textContent = 'Enter valid Base64 encoded UTF-8 text.'; }
    }

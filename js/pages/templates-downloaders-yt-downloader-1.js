document.getElementById('run-btn').addEventListener('click', () => { document.getElementById('errorMessage').textContent = 'This downloader is unavailable while the download service is offline.'; });
function downloadFile() { document.getElementById('errorMessage').textContent = 'The download service is offline.'; }

document.querySelector('[data-action="action-1"]').addEventListener('click', function(event) { showSection('encrypt') });
document.querySelector('[data-action="action-2"]').addEventListener('click', function(event) { showSection('decrypt') });
document.querySelector('[data-action="action-4"]').addEventListener('click', function(event) { encrypt() });
document.querySelector('[data-action="action-5"]').addEventListener('click', function(event) { goBack() });
document.querySelector('[data-action="action-6"]').addEventListener('click', function(event) { decrypt() });
document.querySelector('[data-action="action-7"]').addEventListener('click', function(event) { goBack() });

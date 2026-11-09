document.querySelectorAll('[data-history-back]').forEach(button => {
  button.addEventListener('click', () => {
    if (history.length > 1) history.back();
    else location.assign('/');
  });
});

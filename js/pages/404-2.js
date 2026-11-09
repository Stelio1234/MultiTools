(function () {
      var requested = window.location.href;
      var requestedEl = document.getElementById("requested-url");
      requestedEl.textContent = requested;

      var toast = document.getElementById("toast");
      function showToast(msg) {
        toast.textContent = msg;
        toast.classList.add("show");
        window.setTimeout(function () { toast.classList.remove("show"); }, 1300);
      }

      document.getElementById("copy-btn").addEventListener("click", async function () {
        try {
          await navigator.clipboard.writeText(requested);
          showToast("Copied URL to clipboard ");
        } catch (e) {
          showToast("Couldn’t copy (browser blocked).");
        }
      });
    })();

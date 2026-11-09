
    const timerMemory = new Map();
    let timerStorageFailed = false;
    function readTimer(key) {
      if (!timerStorageFailed) { try { return localStorage.getItem(key); } catch { timerStorageFailed = true; } }
      return timerMemory.get(key) || null;
    }
    function writeTimer(key, value) {
      timerMemory.set(key, String(value));
      if (!timerStorageFailed) { try { localStorage.setItem(key, value); } catch { timerStorageFailed = true; } }
    }
    function clearTimer(key) {
      timerMemory.delete(key);
      if (!timerStorageFailed) { try { localStorage.removeItem(key); } catch { timerStorageFailed = true; } }
    }
let timerInterval;
    let isRunning = false;
    let totalSeconds = 0;

    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const hoursInput = document.getElementById('hours');
    const minutesInput = document.getElementById('minutes');
    const secondsInput = document.getElementById('seconds');
    const notificationContainer = document.getElementById('notificationRequestContainer');
    const circleDisplay = document.getElementById('circleDisplay');
    const circleProgress = document.querySelector('.circle-progress');
    const circleWrapper = document.getElementById('circleWrapper');
    const inputsWrapper = document.getElementById('inputsWrapper');

    const radius = 100;
    const circumference = 2 * Math.PI * radius;
    circleProgress.style.strokeDasharray = circumference;
    circleProgress.style.strokeDashoffset = circumference;

    function updateUI(remainingSeconds) {
      const hours = Math.floor(remainingSeconds / 3600);
      const minutes = Math.floor((remainingSeconds % 3600) / 60);
      const seconds = remainingSeconds % 60;

      hoursInput.value = hours;
      minutesInput.value = minutes;
      secondsInput.value = seconds;

      const display =
        String(hours).padStart(2, "0") + ":" +
        String(minutes).padStart(2, "0") + ":" +
        String(seconds).padStart(2, "0");
      circleDisplay.textContent = display;

      if (totalSeconds > 0) {
        const progress = remainingSeconds / totalSeconds;
        circleProgress.style.strokeDashoffset = circumference * (1 - progress);
      }
    }

    function startTimer() {
      if (isRunning) return;

      let hours = parseInt(hoursInput.value) || 0;
      let minutes = parseInt(minutesInput.value) || 0;
      let seconds = parseInt(secondsInput.value) || 0;
      if (![hoursInput, minutesInput, secondsInput].every(input => input.checkValidity())) return;
      totalSeconds = hours * 3600 + minutes * 60 + seconds;
      if (totalSeconds <= 0) return;

      const startTime = Date.now();
      const endTime = startTime + totalSeconds * 1000;

      writeTimer('timerStart', startTime);
      writeTimer('timerEnd', endTime);
      writeTimer('timerTotal', totalSeconds);
      isRunning = true;

      // Hide inputs, show circle
      inputsWrapper.style.display = "none";
      circleWrapper.style.display = "block";

      updateUI(totalSeconds);
      runCountdown();
    }

    function stopTimer() {
      clearInterval(timerInterval);
      isRunning = false;
      clearTimer('timerStart');
      clearTimer('timerEnd');
      clearTimer('timerTotal');
      updateUI(0);

      // Reset UI
      inputsWrapper.style.display = "flex";
      circleWrapper.style.display = "none";
    }

    function runCountdown() {
      clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        const endTime = parseInt(readTimer('timerEnd')) || 0;
        totalSeconds = parseInt(readTimer('timerTotal')) || 0;
        const remaining = Math.ceil((endTime - Date.now()) / 1000);

        if (remaining <= 0) {
          clearInterval(timerInterval);
          isRunning = false;
          ['timerStart', 'timerEnd', 'timerTotal'].forEach(key => clearTimer(key));
          updateUI(0);
          notifyUser();

          // Reset UI when done
          inputsWrapper.style.display = "flex";
          circleWrapper.style.display = "none";
        } else {
          updateUI(remaining);
        }
      }, 1000);
    }

    function showRequestButton() {
      notificationContainer.innerHTML = `
        <button class='btn' id='requestBtn'>Enable Notifications</button>
      `;
      document.getElementById('requestBtn').addEventListener('click', () => {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            notificationContainer.innerHTML = "<p>✅ Notifications enabled!</p>";
          } else {
            notificationContainer.innerHTML = "<p>❌ Notifications blocked.</p>";
          }
        });
      });
    }

    function notifyUser() {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Timer Complete!', {
          body: 'Your timer has finished.',
          icon: '/images/MultiTools.jpg'
        });
      } else {
        alert('Timer Complete!');
      }
    }

    function checkAndResumeTimer() {
      const endTime = parseInt(readTimer('timerEnd')) || 0;
      totalSeconds = parseInt(readTimer('timerTotal')) || 0;
      const remaining = Math.ceil((endTime - Date.now()) / 1000);
      if (remaining > 0) {
        updateUI(remaining);
        isRunning = true;

        // Show circle, hide inputs
        inputsWrapper.style.display = "none";
        circleWrapper.style.display = "block";

        runCountdown();
      } else {
        stopTimer();
      }
    }

    window.onload = () => {
      if ('Notification' in window && Notification.permission !== 'granted') {
        showRequestButton();
      }
      checkAndResumeTimer();
    };

    startBtn.addEventListener('click', startTimer);
    stopBtn.addEventListener('click', stopTimer);

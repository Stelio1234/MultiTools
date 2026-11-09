
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

    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const hoursInput = document.getElementById('hours');
    const minutesInput = document.getElementById('minutes');
    const secondsInput = document.getElementById('seconds');

    function updateUI(remainingSeconds) {
      const hours = Math.floor(remainingSeconds / 3600);
      const minutes = Math.floor((remainingSeconds % 3600) / 60);
      const seconds = remainingSeconds % 60;
      hoursInput.value = hours;
      minutesInput.value = minutes;
      secondsInput.value = seconds;
    }

    function startTimer() {
      if (isRunning) return;

      let hours = parseInt(hoursInput.value) || 0;
      let minutes = parseInt(minutesInput.value) || 0;
      let seconds = parseInt(secondsInput.value) || 0;
      if (![hoursInput, minutesInput, secondsInput].every(input => input.checkValidity())) return;
      let totalSeconds = hours * 3600 + minutes * 60 + seconds;
      if (totalSeconds <= 0) return;
      const startTime = Date.now();
      const endTime = startTime + totalSeconds * 1000;

      writeTimer('timerStart', startTime);
      writeTimer('timerEnd', endTime);
      writeTimer('timerTotal', totalSeconds);
      isRunning = true;

      runCountdown();
    }

    function stopTimer() {
      clearInterval(timerInterval);
      isRunning = false;
      clearTimer('timerStart');
      clearTimer('timerEnd');
      clearTimer('timerTotal');
    }

    function runCountdown() {
      clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        const endTime = parseInt(readTimer('timerEnd')) || 0;
        const remaining = Math.ceil((endTime - Date.now()) / 1000);

        if (remaining <= 0) {
          clearInterval(timerInterval);
          isRunning = false;
          clearTimer('timerStart');
          clearTimer('timerEnd');
      clearTimer('timerTotal');
          updateUI(0);
          notifyUser();
        } else {
          updateUI(remaining);
        }
      }, 1000);
    }




    function notifyUser() {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Timer Complete!', {
          body: 'Your timer has finished.',
          icon: '/images/MultiTools.jpg'
        });
      } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('Timer Complete!', {
              body: 'Your timer has finished.',
              icon: '/images/MultiTools.jpg'
            });
          } else {
            alert('Timer Complete!');
          }
        });
      } else {
        alert('Timer Complete!');
      }
    }

    function checkAndResumeTimer() {
      const endTime = parseInt(readTimer('timerEnd')) || 0;
      const remaining = Math.ceil((endTime - Date.now()) / 1000);
      if (remaining > 0) {
        updateUI(remaining);
        isRunning = true;
        runCountdown();
      } else {
        stopTimer();
      }
    }

    window.onload = () => {
      checkAndResumeTimer();
    };
    startBtn.addEventListener('click', startTimer);
    stopBtn.addEventListener('click', stopTimer);

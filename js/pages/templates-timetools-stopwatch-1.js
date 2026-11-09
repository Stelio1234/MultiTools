let startTime, timerInterval;
    let elapsedTime = 0;

    const timeDisplay = document.getElementById('timeDisplay');
    const progressCircle = document.querySelector('.progress-ring-progress');
    const radius = progressCircle.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;

    progressCircle.style.strokeDasharray = circumference;
    progressCircle.style.strokeDashoffset = circumference;

    function updateProgress(percentage) {
        const offset = circumference - (percentage / 100) * circumference;
        progressCircle.style.strokeDashoffset = offset;
    }

    function startStopwatch() {
        if (!timerInterval) {
            startTime = Date.now() - elapsedTime;
            timerInterval = setInterval(updateStopwatch, 50);
        }
    }

    function pauseStopwatch() {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    function resetStopwatch() {
        clearInterval(timerInterval);
        timerInterval = null;
        elapsedTime = 0;
        timeDisplay.textContent = '00:00:00.000';
        updateProgress(0);
    }

    function updateStopwatch() {
        elapsedTime = Date.now() - startTime;

        const hours = Math.floor(elapsedTime / 3600000);
        const minutes = Math.floor((elapsedTime % 3600000) / 60000);
        const seconds = Math.floor((elapsedTime % 60000) / 1000);
        const milliseconds = elapsedTime % 1000;

        timeDisplay.textContent = 
            `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(milliseconds, 3)}`;

        const percentage = ((elapsedTime % 60000) / 60000) * 100; 
        updateProgress(percentage);
    }

    function pad(number, length = 2) {
        return number.toString().padStart(length, '0');
    }

    document.getElementById('startButton').addEventListener('click', startStopwatch);
    document.getElementById('pauseButton').addEventListener('click', pauseStopwatch); 
    document.getElementById('resetButton').addEventListener('click', resetStopwatch);

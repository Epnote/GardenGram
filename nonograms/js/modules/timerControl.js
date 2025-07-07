let elapsedSeconds = 0;
let timerInterval = null;

export const startTimer = () => {
    if (timerInterval) {
        return;
    }
    
    const timerDisplay = document.querySelector('.timer');
    timerInterval = setInterval(() => {
        elapsedSeconds += 1;
        const minutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
        const seconds = String(elapsedSeconds % 60).padStart(2, '0');
        timerDisplay.textContent = `${minutes}:${seconds}`;
    }, 1000);
};

export const stopTimer = () => {
    clearInterval(timerInterval);
    timerInterval = null;
};

export const resetTimer = () => {
    elapsedSeconds = 0;
    const timerDisplay = document.querySelector('.timer');
    timerDisplay.textContent = '00:00';
};

export const setTimer = (seconds) => {
    elapsedSeconds = seconds;
    const timerDisplay = document.querySelector('.timer');
    const minutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
    const secs = String(elapsedSeconds % 60).padStart(2, '0');
    timerDisplay.textContent = `${minutes}:${secs}`;
};
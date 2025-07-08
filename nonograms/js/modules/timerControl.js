// Модуль для управления таймером
let startTime = null;
let timerInterval = null;
let timerDisplay = null;

// Инициализация таймера
export const initTimer = () => {
    startTime = new Date();
    updateTimerDisplay();
    startTimer();
};

// Запуск таймера
const startTimer = () => {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    timerInterval = setInterval(() => {
        updateTimerDisplay();
    }, 1000);
};

// Остановка таймера
export const stopTimer = () => {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
};

// Обновление отображения таймера
const updateTimerDisplay = () => {
    if (!startTime) return;
    
    const currentTime = new Date();
    const elapsed = currentTime - startTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    if (timerDisplay) {
        timerDisplay.textContent = timeString;
    }
};

// Установка элемента отображения таймера
export const setTimerDisplay = (element) => {
    timerDisplay = element;
    updateTimerDisplay();
};

// Получение прошедшего времени в формате MM:SS
export const getElapsedTime = () => {
    if (!startTime) return '00:00';
    
    const currentTime = new Date();
    const elapsed = currentTime - startTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// Сброс таймера
export const resetTimer = () => {
    stopTimer();
    startTime = new Date();
    startTimer();
    updateTimerDisplay();
};

// Получение времени начала
export const getStartTime = () => {
    return startTime;
};

// Установка времени (для загрузки сохраненной игры)
export const setElapsedTime = (timeString) => {
    if (!timeString || timeString === '00:00') {
        startTime = new Date();
        return;
    }
    
    // Парсим время в формате MM:SS
    const [minutes, seconds] = timeString.split(':').map(Number);
    const elapsedMs = (minutes * 60 + seconds) * 1000;
    
    // Устанавливаем время начала так, чтобы прошло нужное количество времени
    startTime = new Date(Date.now() - elapsedMs);
    updateTimerDisplay();
};
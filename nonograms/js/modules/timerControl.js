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
export const updateTimerDisplay = () => {
    if (!startTime) return;
    
    const currentTime = new Date();
    const elapsed = currentTime - startTime;
    const timeString = formatTime(elapsed);
    
    if (timerDisplay) {
        timerDisplay.textContent = timeString;
    }
};

// Форматирование времени с поддержкой часов
const formatTime = (elapsedMs) => {
    const totalSeconds = Math.floor(elapsedMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
};

// Установка элемента отображения таймера
export const setTimerDisplay = (element) => {
    timerDisplay = element;
    updateTimerDisplay();
};

// Получение прошедшего времени в формате HH:MM:SS или MM:SS
export const getElapsedTime = () => {
    if (!startTime) return '00:00';
    
    const currentTime = new Date();
    const elapsed = currentTime - startTime;
    return formatTime(elapsed);
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
    
    // Парсим время в формате HH:MM:SS или MM:SS
    const timeParts = timeString.split(':').map(Number);
    let elapsedMs = 0;
    
    if (timeParts.length === 3) {
        // Формат HH:MM:SS
        const [hours, minutes, seconds] = timeParts;
        elapsedMs = (hours * 3600 + minutes * 60 + seconds) * 1000;
    } else if (timeParts.length === 2) {
        // Формат MM:SS
        const [minutes, seconds] = timeParts;
        elapsedMs = (minutes * 60 + seconds) * 1000;
    }
    
    // Устанавливаем время начала так, чтобы прошло нужное количество времени
    startTime = new Date(Date.now() - elapsedMs);
    updateTimerDisplay();
};
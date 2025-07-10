// Version 1.1 - Added volume control
export let isSoundOn = true;

// Инициализация состояния звука
export const initSound = () => {
    // Загружаем сохраненное состояние из localStorage
    const savedSoundState = localStorage.getItem('soundEnabled');
    if (savedSoundState !== null) {
        isSoundOn = savedSoundState === 'true';
    }
    // Устанавливаем глобальную переменную
    window.isSoundOn = isSoundOn;
};

// Сохранение состояния звука
export const saveSoundState = () => {
    localStorage.setItem('soundEnabled', isSoundOn);
};

// Загрузка состояния звука
export const loadSoundState = () => {
    const savedSoundState = localStorage.getItem('soundEnabled');
    if (savedSoundState !== null) {
        isSoundOn = savedSoundState === 'true';
        window.isSoundOn = isSoundOn;
    }
    return isSoundOn;
};

export const toggleSound = () => {
    isSoundOn = !isSoundOn;
    window.isSoundOn = isSoundOn;
    // Сохраняем состояние в localStorage
    saveSoundState();
};

export const playSound = (soundFile) => {
    if (!isSoundOn) return;
    const audio = new Audio(soundFile);
    audio.volume = 0.1; // Громкость 10%
    audio.play();
};

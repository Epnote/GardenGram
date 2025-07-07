// Version 1.1 - Added volume control
export let isSoundOn = true;

export const toggleSound = (button) => {
    isSoundOn = !isSoundOn;
    button.textContent = `Sound: ${isSoundOn ? 'on' : 'off'}`;
};

export const playSound = (soundFile) => {
    if (!isSoundOn) return;
    const audio = new Audio(soundFile);
    audio.volume = 0.1; // Громкость 30% (в 3 раза тише)
    audio.play();
};

import { nonograms } from './nonograms.js';
import { toggleTheme } from './themeControl.js';


import { createGameField } from './gameField.js';
import { initGameField } from '../main.js';
import { showLibrary } from '../main.js';



export function createGameInterface() {
    const mainContainer = document.createElement('div');
    mainContainer.className = 'main-container';

    const gameContainer = document.createElement('div');
    gameContainer.className = 'game-container';

    const controlRow1 = document.createElement('div');
    controlRow1.className = 'control-row';

    const controlRow2 = document.createElement('div');
    controlRow2.className = 'control-row';

    const infoRow = document.createElement('div');
    infoRow.className = 'info-row';

    const settingsRow = document.createElement('div');
    settingsRow.className = 'settings-row';

    const resetBtn = document.createElement('button');
    resetBtn.className = 'reset-btn';
    resetBtn.innerHTML = '🔄';
    resetBtn.style.cssText = 'color: #22c55e; font-size: 50px; border: none; background: transparent; cursor: pointer; padding: 8px; border-radius: 4px; transition: transform 0.2s;';
    resetBtn.addEventListener('mouseenter', () => {
        resetBtn.style.transform = 'scale(1.1)';
    });
    resetBtn.addEventListener('mouseleave', () => {
        resetBtn.style.transform = 'scale(1)';
    });
    controlRow1.appendChild(resetBtn);

    const randomBtn = document.createElement('button');
    randomBtn.className = 'random-btn';
    randomBtn.innerHTML = '🎲';
    randomBtn.style.cssText = 'color: #3b82f6; font-size: 50px; border: none; background: transparent; cursor: pointer; padding: 8px; border-radius: 4px; transition: transform 0.2s;';
    randomBtn.addEventListener('mouseenter', () => {
        randomBtn.style.transform = 'scale(1.1)';
    });
    randomBtn.addEventListener('mouseleave', () => {
        randomBtn.style.transform = 'scale(1)';
    });
    controlRow1.appendChild(randomBtn);

    const libraryBtn = document.createElement('button');
    libraryBtn.className = 'library-btn';
    libraryBtn.textContent = '📚';
    libraryBtn.style.cssText = 'color: #8b5cf6; font-size: 50px; border: none; background: transparent; cursor: pointer; padding: 8px; border-radius: 4px; transition: transform 0.2s;';
    libraryBtn.addEventListener('mouseenter', () => {
        libraryBtn.style.transform = 'scale(1.1)';
    });
    libraryBtn.addEventListener('mouseleave', () => {
        libraryBtn.style.transform = 'scale(1)';
    });
    libraryBtn.addEventListener('click', () => {
        showLibrary();
    });
    controlRow1.appendChild(libraryBtn);

    const themeBtn = document.createElement('button');
    themeBtn.className = 'theme-btn';
    themeBtn.textContent = '☯';
    themeBtn.style.cssText = 'color: #333; font-size: 50px; border: none; background: transparent; cursor: pointer; padding: 8px; border-radius: 4px; transition: transform 0.2s;';
    // В темной теме делаем иконку белой
    if (document.body.classList.contains('dark')) {
        themeBtn.style.color = 'white';
    }
    themeBtn.addEventListener('mouseenter', () => {
        themeBtn.style.transform = 'scale(1.1)';
    });
    themeBtn.addEventListener('mouseleave', () => {
        themeBtn.style.transform = 'scale(1)';
    });
    themeBtn.addEventListener('click', () => {
        toggleTheme();
    });
    controlRow1.appendChild(themeBtn);







    const hint = document.createElement('div');
    hint.className = 'hint';
    hint.innerHTML = '<strong>Подсказка:</strong> ЛКМ - заполнить, ПКМ - крестик';
    infoRow.appendChild(hint);









    gameContainer.appendChild(controlRow1);
    gameContainer.appendChild(controlRow2);
    gameContainer.appendChild(infoRow);
    gameContainer.appendChild(settingsRow);
    mainContainer.appendChild(gameContainer);

    return mainContainer;
}

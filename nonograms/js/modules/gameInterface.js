import { nonograms } from './nonograms.js';
import { toggleTheme } from './themeControl.js';


import { createGameField } from './gameField.js';
import { initGameField, zoomNonogram, resetNonogramView, showHighScoresModal, showSolution } from '../main.js';
import { showLibrary } from '../main.js';



export function createGameInterface() {
    const mainContainer = document.createElement('div');
    mainContainer.className = 'main-container';

    // Верхние кнопки
    const topControls = document.createElement('div');
    topControls.className = 'top-controls';

    const resetBtn = document.createElement('button');
    resetBtn.className = 'reset-btn';
    resetBtn.innerHTML = '<img src="./images/UI/Restart.png" alt="Restart" style="width: 48px; height: 48px;">';
    resetBtn.style.cssText = 'border: none; background: transparent; cursor: pointer; padding: 8px; border-radius: 0; transition: transform 0.2s;';
    resetBtn.addEventListener('mouseenter', () => {
        resetBtn.style.transform = 'scale(1.1)';
    });
    resetBtn.addEventListener('mouseleave', () => {
        resetBtn.style.transform = 'scale(1)';
    });
    topControls.appendChild(resetBtn);

    const randomBtn = document.createElement('button');
    randomBtn.className = 'random-btn';
    randomBtn.innerHTML = '<img src="./images/UI/Random.png" alt="Random" style="width: 48px; height: 48px;">';
    randomBtn.style.cssText = 'border: none; background: transparent; cursor: pointer; padding: 8px; border-radius: 0; transition: transform 0.2s;';
    randomBtn.addEventListener('mouseenter', () => {
        randomBtn.style.transform = 'scale(1.1)';
    });
    randomBtn.addEventListener('mouseleave', () => {
        randomBtn.style.transform = 'scale(1)';
    });
    topControls.appendChild(randomBtn);

    const libraryBtn = document.createElement('button');
    libraryBtn.className = 'library-btn';
    libraryBtn.innerHTML = '<img src="./images/UI/Library.png" alt="Library" style="width: 48px; height: 48px;">';
    libraryBtn.style.cssText = 'border: none; background: transparent; cursor: pointer; padding: 8px; border-radius: 0; transition: transform 0.2s;';
    libraryBtn.addEventListener('mouseenter', () => {
        libraryBtn.style.transform = 'scale(1.1)';
    });
    libraryBtn.addEventListener('mouseleave', () => {
        libraryBtn.style.transform = 'scale(1)';
    });
    libraryBtn.addEventListener('click', () => {
        showLibrary();
    });
    topControls.appendChild(libraryBtn);

    const themeBtn = document.createElement('button');
    themeBtn.className = 'theme-btn';
    themeBtn.innerHTML = '<img src="./images/UI/LightTheme.png" alt="Theme" style="width: 48px; height: 48px;">';
    themeBtn.style.cssText = 'border: none; background: transparent; cursor: pointer; padding: 8px; border-radius: 0; transition: transform 0.2s;';
    if (document.body.classList.contains('dark')) {
        themeBtn.innerHTML = '<img src="./images/UI/DarkTheme.png" alt="Theme" style="width: 48px; height: 48px;">';
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
    topControls.appendChild(themeBtn);

    // Кнопки масштабирования
    const zoomInBtn = document.createElement('button');
    zoomInBtn.className = 'zoom-btn';
    zoomInBtn.innerHTML = '<img src="./images/UI/Plus.png" alt="Zoom In" style="width: 48px; height: 48px;">';
    zoomInBtn.style.cssText = 'border: none; background: transparent; cursor: pointer; padding: 8px; border-radius: 0; transition: transform 0.2s;';
    zoomInBtn.addEventListener('mouseenter', () => {
        zoomInBtn.style.transform = 'scale(1.1)';
    });
    zoomInBtn.addEventListener('mouseleave', () => {
        zoomInBtn.style.transform = 'scale(1)';
    });
    zoomInBtn.addEventListener('click', () => {
        zoomNonogram(1.2);
    });
    topControls.appendChild(zoomInBtn);

    const zoomOutBtn = document.createElement('button');
    zoomOutBtn.className = 'zoom-btn';
    zoomOutBtn.innerHTML = '<img src="./images/UI/Minus.png" alt="Zoom Out" style="width: 48px; height: 48px;">';
    zoomOutBtn.style.cssText = 'border: none; background: transparent; cursor: pointer; padding: 8px; border-radius: 0; transition: transform 0.2s;';
    zoomOutBtn.addEventListener('mouseenter', () => {
        zoomOutBtn.style.transform = 'scale(1.1)';
    });
    zoomOutBtn.addEventListener('mouseleave', () => {
        zoomOutBtn.style.transform = 'scale(1)';
    });
    zoomOutBtn.addEventListener('click', () => {
        zoomNonogram(0.8);
    });
    topControls.appendChild(zoomOutBtn);

    const resetZoomBtn = document.createElement('button');
    resetZoomBtn.className = 'zoom-btn';
    resetZoomBtn.innerHTML = '<img src="./images/UI/Zero.png" alt="Reset Zoom" style="width: 48px; height: 48px;">';
    resetZoomBtn.style.cssText = 'border: none; background: transparent; cursor: pointer; padding: 8px; border-radius: 0; transition: transform 0.2s;';
    resetZoomBtn.addEventListener('mouseenter', () => {
        resetZoomBtn.style.transform = 'scale(1.1)';
    });
    resetZoomBtn.addEventListener('mouseleave', () => {
        resetZoomBtn.style.transform = 'scale(1)';
    });
    resetZoomBtn.addEventListener('click', () => {
        resetNonogramView();
    });
    topControls.appendChild(resetZoomBtn);



    // Таймер
    const timerBtn = document.createElement('button');
    timerBtn.className = 'timer-btn';
    timerBtn.innerHTML = '00:00';
    timerBtn.style.cssText = 'color: #ef4444; font-size: 20px; font-weight: bold; border: none; background: transparent; cursor: pointer; padding: 8px; border-radius: 0; transition: transform 0.2s; font-family: monospace; min-width: 100px;';
    timerBtn.addEventListener('mouseenter', () => {
        timerBtn.style.transform = 'scale(1.1)';
    });
    timerBtn.addEventListener('mouseleave', () => {
        timerBtn.style.transform = 'scale(1)';
    });
    timerBtn.addEventListener('click', () => {
        showHighScoresModal();
    });
    topControls.appendChild(timerBtn);

    // Экспортируем кнопку таймера для обновления
    window.timerButton = timerBtn;

    // Кнопка решения
    const solutionBtn = document.createElement('button');
    solutionBtn.className = 'solution-btn';
    solutionBtn.innerHTML = '<img src="./images/UI/Answer.png" alt="Solution" style="width: 48px; height: 48px;">';
    solutionBtn.style.cssText = 'border: none; background: transparent; cursor: pointer; padding: 8px; border-radius: 0; transition: transform 0.2s;';
    solutionBtn.addEventListener('mouseenter', () => {
        solutionBtn.style.transform = 'scale(1.1)';
    });
    solutionBtn.addEventListener('mouseleave', () => {
        solutionBtn.style.transform = 'scale(1)';
    });
    solutionBtn.addEventListener('click', async () => {
        await showSolution();
    });
    topControls.appendChild(solutionBtn);

    // Подсказка
    const infoRow = document.createElement('div');
    infoRow.className = 'info-row';
    // Функция для определения мобильной платформы
    const isMobile = () => {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               window.innerWidth <= 768;
    };

    const hint = document.createElement('div');
    hint.className = 'hint';
    
    if (isMobile()) {
        hint.innerHTML = '<strong>📱 Мобильное:</strong> Короткое касание - заполнить, долгое касание - крестик, жесты - зум/перемещение';
    } else {
        hint.innerHTML = '<strong>💻 ПК:</strong> ЛКМ - заполнить, ПКМ - крестик, колесо мыши - зум, перетаскивание - перемещение';
    }
    infoRow.appendChild(hint);

    document.body.appendChild(topControls);
    mainContainer.appendChild(infoRow);
    return mainContainer;
}

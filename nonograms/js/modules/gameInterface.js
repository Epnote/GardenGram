import { nonograms } from './nonograms.js';
import { toggleTheme } from './themeControl.js';


import { createGameField } from './gameField.js';
import { initGameField, zoomNonogram, resetNonogramView } from '../main.js';
import { showLibrary } from '../main.js';



export function createGameInterface() {
    const mainContainer = document.createElement('div');
    mainContainer.className = 'main-container';

    // Верхние кнопки
    const topControls = document.createElement('div');
    topControls.className = 'top-controls';

    const resetBtn = document.createElement('button');
    resetBtn.className = 'reset-btn';
    resetBtn.innerHTML = '↻';
    resetBtn.style.cssText = 'color: #22c55e; font-size: 48px; font-weight: bold; border: none; background: transparent; cursor: pointer; padding: 8px; border-radius: 0; transition: transform 0.2s;';
    resetBtn.addEventListener('mouseenter', () => {
        resetBtn.style.transform = 'scale(1.1)';
    });
    resetBtn.addEventListener('mouseleave', () => {
        resetBtn.style.transform = 'scale(1)';
    });
    topControls.appendChild(resetBtn);

    const randomBtn = document.createElement('button');
    randomBtn.className = 'random-btn';
    randomBtn.innerHTML = '⚄';
    randomBtn.style.cssText = 'color: #3b82f6; font-size: 48px; font-weight: bold; border: none; background: transparent; cursor: pointer; padding: 8px; border-radius: 0; transition: transform 0.2s;';
    randomBtn.addEventListener('mouseenter', () => {
        randomBtn.style.transform = 'scale(1.1)';
    });
    randomBtn.addEventListener('mouseleave', () => {
        randomBtn.style.transform = 'scale(1)';
    });
    topControls.appendChild(randomBtn);

    const libraryBtn = document.createElement('button');
    libraryBtn.className = 'library-btn';
    libraryBtn.textContent = '📖';
    libraryBtn.style.cssText = 'color: #8b5cf6; font-size: 48px; font-weight: bold; border: none; background: transparent; cursor: pointer; padding: 8px; border-radius: 0; transition: transform 0.2s;';
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
    themeBtn.textContent = '☀';
    themeBtn.style.cssText = 'color: #333; font-size: 48px; font-weight: bold; border: none; background: transparent; cursor: pointer; padding: 8px; border-radius: 0; transition: transform 0.2s;';
    if (document.body.classList.contains('dark')) {
        themeBtn.style.color = 'white';
        themeBtn.textContent = '☾';
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
    zoomInBtn.innerHTML = '⊕';
    zoomInBtn.style.cssText = 'color: #f59e0b; font-size: 48px; font-weight: bold; border: none; background: transparent; cursor: pointer; padding: 8px; border-radius: 0; transition: transform 0.2s;';
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
    zoomOutBtn.innerHTML = '⊖';
    zoomOutBtn.style.cssText = 'color: #f59e0b; font-size: 48px; font-weight: bold; border: none; background: transparent; cursor: pointer; padding: 8px; border-radius: 0; transition: transform 0.2s;';
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
    resetZoomBtn.innerHTML = '⌂';
    resetZoomBtn.style.cssText = 'color: #f59e0b; font-size: 48px; font-weight: bold; border: none; background: transparent; cursor: pointer; padding: 8px; border-radius: 0; transition: transform 0.2s;';
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

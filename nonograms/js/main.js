import { createGameField } from './modules/gameField.js';
import { createGameInterface } from './modules/gameInterface.js';
import { nonograms } from './modules/nonograms.js';
import { playSound } from './modules/soundControl.js';
import { updateCellStyles, applySavedTheme } from './modules/themeControl.js';
import { initTimer, setTimerDisplay, getElapsedTime, resetTimer, setElapsedTime, updateTimerDisplay } from './modules/timerControl.js';
import { initLisSDK, showRewardedAd, isRewardedAdAvailable } from './modules/lisSDKIntegration.js';
import { initLocalization, t, createLanguageToggle } from './modules/localization.js';
import { initSound } from './modules/soundControl.js';


window.currentNonogram = nonograms['heart'];
let startTime = null;
let mainContainer = null;
let timerInterval = null;

// Переменные для отслеживания состояния мыши
let isMouseDown = false;
let currentMouseAction = null; // 'fill' или 'cross'
let initialAction = null; // Запоминаем начальное действие при зажатии кнопки
let shouldAdd = true; // true - добавлять, false - убирать

// Переменные для асинхронного автосохранения
let autoSaveInterval = null;
let lastSaveTime = 0;
let gameStateDirty = false;

// Переменные для масштабирования и перемещения
let currentScale = 1;
let currentTranslateX = 0;
let currentTranslateY = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dragAnimationFrame = null;
let lastTranslateX = 0;
let lastTranslateY = 0;

// Отметить, что состояние игры изменилось (для автосохранения)
const markGameDirty = () => {
    gameStateDirty = true;
};

// Запуск асинхронного автосохранения каждые 3 секунды
const startAutoSave = () => {
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
    }
    
    autoSaveInterval = setInterval(() => {
        // Сохраняем только если прошло 3 секунды с последнего сохранения
        const now = Date.now();
        if (now - lastSaveTime >= 3000) {
            performAsyncSave();
            lastSaveTime = now;
        }
    }, 3000);
};

// Остановка автосохранения
const stopAutoSave = () => {
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
        autoSaveInterval = null;
    }
};

// Асинхронное сохранение игры
const performAsyncSave = () => {
    // Используем requestIdleCallback для сохранения в свободное время браузера
    if (window.requestIdleCallback) {
        requestIdleCallback(() => {
            saveGameData();
        }, { timeout: 1000 });
    } else {
        // Fallback для браузеров без requestIdleCallback
        setTimeout(() => {
            saveGameData();
        }, 0);
    }
};

// Фактическое сохранение данных
const saveGameData = () => {
    try {
        const cells = document.querySelectorAll('.grid .cell');
        const cellStates = Array.from(cells).map(cell => ({
            row: cell.dataset.row,
            col: cell.dataset.col,
            filled: cell.classList.contains('filled'),
            crossed: cell.classList.contains('crossed')
        }));
        
        // Сохраняем состояние зачеркнутых цифр в подсказках
        const clueNumbers = document.querySelectorAll('.clue-number');
        const completedNumbers = Array.from(clueNumbers)
            .map((number, index) => ({ 
                index, 
                value: number.dataset.value,
                completed: number.classList.contains('completed') 
            }))
            .filter(item => item.completed)
            .map(item => ({ index: item.index, value: item.value }));
        
        const gameData = {
            nonogramName: currentNonogram.name,
            cellStates: cellStates,
            completedNumbers: completedNumbers,
            elapsedTime: getElapsedTime(),
            soundEnabled: window.isSoundOn !== false
        };
        localStorage.setItem('savedGame', JSON.stringify(gameData));

    } catch (error) {
        console.error('Error auto-saving game:', error);
    }
};

// Функция для определения мобильной платформы
const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           window.innerWidth <= 768;
};

// Функции для масштабирования и перемещения
export const zoomNonogram = (factor) => {
    const container = document.querySelector('.nonogram-container');
    if (!container) return;
    
    const newScale = Math.max(0.3, Math.min(3, currentScale * factor));
    currentScale = newScale;
    
    applyTransform();
};

export const resetNonogramView = () => {
    console.log('Target button clicked');
    currentScale = 1;
    currentTranslateX = 0;
    currentTranslateY = 0;
    centerNonogram();
};

const centerNonogram = () => {
    const container = document.querySelector('.nonogram-container');
    const wrapper = document.querySelector('.nonogram-wrapper');
    if (!container || !wrapper) {
        console.log('Container or wrapper not found');
        return;
    }
    
    // Ждем, пока элементы полностью загрузятся
    if (wrapper.offsetWidth === 0 || wrapper.offsetHeight === 0) {
        console.log('Wrapper not ready, retrying...');
        setTimeout(centerNonogram, 50);
        return;
    }
    
    // Центрируем относительно wrapper'а
    const wrapperCenterX = wrapper.offsetWidth / 2;
    const wrapperCenterY = wrapper.offsetHeight / 2;
    
    console.log('Centering nonogram:', {
        wrapperWidth: wrapper.offsetWidth,
        wrapperHeight: wrapper.offsetHeight,
        centerX: wrapperCenterX,
        centerY: wrapperCenterY,
        currentScale: currentScale
    });
    
    // При transform-origin: center, translate перемещает центр элемента
    // Поскольку nonogram-container уже центрирован в wrapper'е (justify-content: center; align-items: center;)
    // и transform-origin: center, нам нужно установить translate(0,0) чтобы сохранить центрирование
    currentTranslateX = 0;
    currentTranslateY = 0;
    
    applyTransform();
};

const applyTransform = () => {
    const container = document.querySelector('.nonogram-container');
    if (!container) return;
    
    // При transform-origin: center, translate перемещает центр элемента
    // currentTranslateX и currentTranslateY уже содержат координаты центра
    container.style.transform = `translate(${currentTranslateX}px, ${currentTranslateY}px) scale(${currentScale})`;
};

// Функция для инициализации управления масштабированием
const initZoomControls = () => {
    const container = document.querySelector('.nonogram-container');
    if (!container) return;
    
    // Проверяем, есть ли уже wrapper
    let wrapper = container.parentNode;
    if (!wrapper.classList.contains('nonogram-wrapper')) {
        // Оборачиваем контейнер в wrapper для overflow
        wrapper = document.createElement('div');
        wrapper.className = 'nonogram-wrapper';
        container.parentNode.insertBefore(wrapper, container);
        wrapper.appendChild(container);
    }
    

    
    // Колесо мыши для зума
    wrapper.addEventListener('wheel', (e) => {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        zoomNonogram(factor);
    });
    
    // Перетаскивание мышью
    wrapper.addEventListener('mousedown', (e) => {
        if (e.target.closest('.cell')) return; // Не перетаскиваем при клике на клетку
        
        isDragging = true;
        dragStartX = e.clientX - currentTranslateX;
        dragStartY = e.clientY - currentTranslateY;
        wrapper.style.cursor = 'grabbing';
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        currentTranslateX = e.clientX - dragStartX;
        currentTranslateY = e.clientY - dragStartY;
        
        // Используем requestAnimationFrame для оптимизации
        if (!dragAnimationFrame) {
            dragAnimationFrame = requestAnimationFrame(() => {
                applyTransform();
                dragAnimationFrame = null;
            });
        }
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            wrapper.style.cursor = 'grab';
            
            // Отменяем pending animation frame
            if (dragAnimationFrame) {
                cancelAnimationFrame(dragAnimationFrame);
                dragAnimationFrame = null;
            }
        }
    });
    
    // Мобильные жесты
    let initialDistance = 0;
    let initialScale = 1;
    
    wrapper.addEventListener('touchstart', (e) => {
        if (e.target.closest('.cell')) return; // Не перетаскиваем при касании клетки
        
        if (e.touches.length === 2) {
            // Два пальца - масштабирование
            initialDistance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            initialScale = currentScale;
        } else if (e.touches.length === 1) {
            // Один палец - перетаскивание
            isDragging = true;
            dragStartX = e.touches[0].clientX - currentTranslateX;
            dragStartY = e.touches[0].clientY - currentTranslateY;
        }
    }, { passive: true });
    
    wrapper.addEventListener('touchmove', (e) => {
        e.preventDefault();
        
        if (e.touches.length === 2) {
            // Масштабирование двумя пальцами
            const distance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            
            if (initialDistance > 0) {
                const scale = distance / initialDistance;
                currentScale = Math.max(0.3, Math.min(3, initialScale * scale));
                applyTransform();
            }
        } else if (e.touches.length === 1 && isDragging) {
            // Перетаскивание одним пальцем
            currentTranslateX = e.touches[0].clientX - dragStartX;
            currentTranslateY = e.touches[0].clientY - dragStartY;
            
            // Используем requestAnimationFrame для оптимизации
            if (!dragAnimationFrame) {
                dragAnimationFrame = requestAnimationFrame(() => {
                    applyTransform();
                    dragAnimationFrame = null;
                });
            }
        }
    });
    
    wrapper.addEventListener('touchend', () => {
        isDragging = false;
        initialDistance = 0;
        
        // Отменяем pending animation frame
        if (dragAnimationFrame) {
            cancelAnimationFrame(dragAnimationFrame);
            dragAnimationFrame = null;
        }
    }, { passive: true });
};

// Функция для добавления подсказки
const addHint = () => {
    // Удаляем существующую подсказку, если она есть
    const existingHint = document.querySelector('.hint');
    if (existingHint) {
        existingHint.remove();
    }
    
    const hint = document.createElement('div');
    hint.className = 'hint';
    
    if (isMobile()) {
        hint.innerHTML = `
            <p>📱 <strong>Мобильное управление:</strong></p>
            <p>• Короткое касание - заполнить/очистить клетку</p>
            <p>• Долгое касание (0.5с) - поставить/убрать крестик</p>
            <p>• Касание цифры в подсказке - зачеркнуть/убрать зачеркивание</p>
        `;
    } else {
        hint.innerHTML = `
            <p>💻 <strong>Управление для ПК:</strong></p>
            <p>• Левый клик - заполнить/очистить клетку</p>
            <p>• Правый клик - поставить/убрать крестик</p>
            <p>• Зажмите кнопку мыши и ведите для быстрого заполнения</p>
            <p>• Клик по цифре в подсказке - зачеркнуть/убрать зачеркивание</p>
        `;
    }
    hint.style.cssText = `
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px;
        border-radius: 5px;
        margin-top: 10px;
        font-size: 12px;
        text-align: center;
    `;
    mainContainer.appendChild(hint);
};

// Функция для автоматической загрузки сохранений
const autoLoadGame = () => {
    const savedGameData = JSON.parse(localStorage.getItem('savedGame'));
    
    if (savedGameData) {
        const selectedNonogram = Object.values(nonograms).find(n => n.name === savedGameData.nonogramName);
        if (selectedNonogram) {
            currentNonogram = selectedNonogram;
            
            const oldField = document.querySelector('.nonogram-container');
            if (oldField) oldField.remove();
            
            const newField = createGameField(currentNonogram);
            mainContainer.appendChild(newField);
            
            const cells = document.querySelectorAll('.grid .cell');
            savedGameData.cellStates.forEach(state => {
                const cell = Array.from(cells).find(c => c.dataset.row == state.row && c.dataset.col == state.col);
                if (cell) {
                    if (state.filled) {
                        cell.classList.add('filled');
                    } else {
                        cell.classList.remove('filled');
                    }
                    if (state.crossed) {
                        cell.classList.add('crossed');
                    } else {
                        cell.classList.remove('crossed');
                    }
                }
            });
            
            // Восстанавливаем состояние зачеркнутых цифр в подсказках
            if (savedGameData.completedNumbers) {
                const clueNumbers = document.querySelectorAll('.clue-number');
                savedGameData.completedNumbers.forEach(item => {
                    if (clueNumbers[item.index] && clueNumbers[item.index].dataset.value === item.value) {
                        clueNumbers[item.index].classList.add('completed');
                    }
                });
            }
            
            // Проверяем и зачеркиваем полностью заполненные подсказки
            checkAndMarkCompletedClues();

            // Восстанавливаем состояние звука
            if (savedGameData.soundEnabled !== undefined) {
                window.isSoundOn = savedGameData.soundEnabled;
                // Обновляем иконку звука
                const soundBtn = document.querySelector('.sound-btn');
                if (soundBtn) {
                    soundBtn.innerHTML = savedGameData.soundEnabled ? 
                        '<img src="./images/UI/SoundOn.png" alt="Sound On" style="width: 48px; height: 48px;">' :
                        '<img src="./images/UI/SoundOff.png" alt="Sound Off" style="width: 48px; height: 48px;">';
                }
            }

            // Восстанавливаем время игры (будет применено после инициализации таймера)
            const savedElapsedTime = savedGameData.elapsedTime;

            addHint();
            
            const mapSelectButton = document.querySelector('.map-btn');
            if (mapSelectButton) {
                mapSelectButton.querySelector('span:first-child').textContent = currentNonogram.name;
            }
            
            // Инициализируем управление масштабированием для загруженной игры
            setTimeout(() => {
                initZoomControls();
                centerNonogram();
                // Инициализируем клики по подсказкам
                initClueClickHandlers();
            }, 200);
            
            return savedElapsedTime; // Возвращаем сохраненное время
        }
    }
    
    return null; // Сохранение не найдено
};

document.addEventListener('DOMContentLoaded', async () => {
    // Инициализируем звук
    initSound();
    
    // Инициализируем локализацию
    await initLocalization();
    
    // Инициализируем LisSDK
    try {
        await initLisSDK();
        console.log('LisSDK готов к работе');
    } catch (error) {
        console.log('LisSDK недоступен, используем локальный режим');
    }
    
    // Удаляем старый интерфейс, если он есть
    const old = document.querySelector('.main-container');
    if (old) old.remove();

    // Применяем сохранённую тему
    applySavedTheme();
    
    // Создаем интерфейс после полной инициализации локализации
    mainContainer = createGameInterface();
    
    // Добавляем контейнер в DOM
    document.body.appendChild(mainContainer);
    
    // Пытаемся загрузить сохраненную игру
    const savedGameData = autoLoadGame();
    
    // Если сохранение не найдено, создаем новую игру
    if (!savedGameData) {
        let gameField = createGameField(currentNonogram);
        mainContainer.appendChild(gameField);
        addHint();
    }
    
    // Инициализируем управление масштабированием
    setTimeout(() => {
        initZoomControls();
        centerNonogram();
        // Инициализируем клики по подсказкам
        initClueClickHandlers();
        
        // Инициализируем таймер
        if (window.timerButton) {
            setTimerDisplay(window.timerButton);
            initTimer();
            
            // Применяем сохраненное время, если есть
            if (savedGameData) {
                setElapsedTime(savedGameData);
            }
            
            // Обновляем отображение таймера после инициализации
            updateTimerDisplay();
        }
    }, 100);
    
    // Центрирование при изменении размера окна
    window.addEventListener('resize', () => {
        setTimeout(() => {
            centerNonogram();
        }, 100);
    });
    

    
    // Запускаем автосохранение каждые 3 секунды
    startAutoSave();

    const resetGame = () => {
        const cells = document.querySelectorAll('.grid .cell');
        cells.forEach(cell => {
            cell.classList.remove('filled');
            cell.classList.remove('crossed');
        });
        
        // Убираем зачеркивания с цифр в подсказках при сбросе
        const clueNumbers = document.querySelectorAll('.clue-number');
        clueNumbers.forEach(number => {
            number.classList.remove('completed');
        });
        
        // Сбрасываем таймер
        resetTimer();
        
        // Отмечаем, что состояние игры изменилось
        markGameDirty();
    };

    const resetButton = document.querySelector('.reset-btn');
    resetButton.addEventListener('click', () => {
        resetGame();
    });

    const getRandomLevel = () => {
        const levels = [1, 2, 3];
        return levels[Math.floor(Math.random() * levels.length)];
    };
    
    const getRandomNonogram = (level) => {
        const availableNonograms = Object.values(nonograms).filter(nono => nono.level === level || nono.level === undefined);
        return availableNonograms[Math.floor(Math.random() * availableNonograms.length)];
    };

    const randomButton = document.querySelector('.random-btn');
    randomButton.addEventListener('click', () => {
        // Останавливаем автосохранение
        stopAutoSave();
        
        const selectedLevel = getRandomLevel();
        const selectedNonogram = getRandomNonogram(selectedLevel);
        if (selectedNonogram) {
            // Обновляем текущую нонограмму
            window.currentNonogram = selectedNonogram;
            
            // Удаляем старое поле
            const oldField = document.querySelector('.nonogram-container');
            if (oldField) {
                const oldWrapper = oldField.closest('.nonogram-wrapper');
                if (oldWrapper) {
                    oldWrapper.remove();
                } else {
                    oldField.remove();
                }
            }
            
            // Создаем новое поле
            const newField = createGameField(selectedNonogram);
            mainContainer.appendChild(newField);
            
            // Сбрасываем масштаб и позицию
            currentScale = 1;
            currentTranslateX = 0;
            currentTranslateY = 0;
            
            // Инициализируем игровое поле
            initGameField();
            addHint();
            
            // Обновляем название в кнопке выбора карты
            const mapSelectButton = document.querySelector('.map-btn');
            if (mapSelectButton) {
                mapSelectButton.querySelector('span:first-child').textContent = selectedNonogram.name;
            }
            
            // Инициализируем управление масштабированием
            setTimeout(() => {
                initZoomControls();
                initClueClickHandlers();
                applyTransform();
            }, 50);
            
            // Сбрасываем таймер
            resetTimer();
            
            // Запускаем автосохранение для новой игры
            startAutoSave();
        }
    });

    startTime = new Date();
    // Инициализируем игровое поле только один раз в конце
    initGameField();
});

export const initGameField = () => {
    const cells = document.querySelectorAll('.grid .cell');
    updateCellStyles(cells);
    let gameStarted = false;
    
    // Переменные для мобильного управления
    let touchStartTime = 0;
    let touchStartCell = null;
    let isLongPress = false;
    let longPressTimer = null;
    
    // Функция для обработки клика по клетке
    const handleCellClick = (cell, action) => {
        if (!gameStarted) {
            gameStarted = true;
        }
        
        let stateChanged = false;
        
        if (action === 'fill') {
            if (cell.classList.contains('filled')) {
                cell.classList.remove('filled');
                stateChanged = true;
            } else if (!cell.classList.contains('filled')) {
                cell.classList.remove('crossed');
                cell.classList.add('filled');
                stateChanged = true;
            }
        } else if (action === 'cross') {
            if (cell.classList.contains('crossed')) {
                cell.classList.remove('crossed');
                stateChanged = true;
            } else if (!cell.classList.contains('crossed')) {
                cell.classList.remove('filled');
                cell.classList.add('crossed');
                stateChanged = true;
            }
        }
        
        // Воспроизводим звук только при реальном изменении состояния
        if (stateChanged) {
            playSound('button-on.mp3');
            // Отмечаем, что состояние игры изменилось
            markGameDirty();
            
            // Проверяем победу только при изменении закрашенных клеток
            if (action === 'fill') {
                const solution = currentNonogram.solution;
                if (checkWin(cells, solution)) {
                    playSound('victory.mp3');
                }
            }
        }
    };
    
    // Функция для обработки наведения мыши при зажатой кнопке
    const handleCellMouseOver = (cell) => {
        if (isMouseDown && initialAction) {
            if (initialAction === 'fill') {
                if (shouldAdd) {
                    // Добавляем заполнение
                    if (!cell.classList.contains('filled')) {
                        handleCellClick(cell, 'fill');
                    }
                } else {
                    // Убираем заполнение
                    if (cell.classList.contains('filled')) {
                        handleCellClick(cell, 'fill');
                    }
                }
            } else if (initialAction === 'cross') {
                if (shouldAdd) {
                    // Добавляем крестик
                    if (!cell.classList.contains('crossed')) {
                        handleCellClick(cell, 'cross');
                    }
                } else {
                    // Убираем крестик
                    if (cell.classList.contains('crossed')) {
                        handleCellClick(cell, 'cross');
                    }
                }
            }
        }
    };
    
    cells.forEach(cell => {
        // Левый клик - заполнение/очистка клетки
        cell.addEventListener('mousedown', (e) => {
            e.preventDefault();
            
            if (e.button === 0) { // Левая кнопка мыши
                isMouseDown = true;
                currentMouseAction = 'fill';
                initialAction = 'fill';
                // Запоминаем, нужно ли добавлять или убирать
                shouldAdd = !cell.classList.contains('filled');
                handleCellClick(cell, 'fill');
            } else if (e.button === 2) { // Правая кнопка мыши
                isMouseDown = true;
                currentMouseAction = 'cross';
                initialAction = 'cross';
                // Запоминаем, нужно ли добавлять или убирать
                shouldAdd = !cell.classList.contains('crossed');
                handleCellClick(cell, 'cross');
            }
        });
        
        // Обработка наведения мыши при зажатой кнопке
        cell.addEventListener('mouseover', () => {
            handleCellMouseOver(cell);
        });
        
        // Обработка наведения мыши при зажатой кнопке (для правой кнопки)
        cell.addEventListener('mouseenter', () => {
            handleCellMouseOver(cell);
        });
        
        // Предотвращаем контекстное меню при правом клике
        cell.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
        
        // Мобильное управление - касания
        cell.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touchStartTime = Date.now();
            touchStartCell = cell;
            isLongPress = false;
            
            // Таймер для длительного нажатия (крестик)
            longPressTimer = setTimeout(() => {
                isLongPress = true;
                shouldAdd = !cell.classList.contains('crossed');
                handleCellClick(cell, 'cross');
            }, 500); // 500ms для длительного нажатия
        }, { passive: false });
        
        cell.addEventListener('touchend', (e) => {
            e.preventDefault();
            const touchDuration = Date.now() - touchStartTime;
            
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
            
            // Если это не длительное нажатие и та же клетка
            if (touchDuration < 500 && touchStartCell === cell && !isLongPress) {
                shouldAdd = !cell.classList.contains('filled');
                handleCellClick(cell, 'fill');
            }
            
            touchStartCell = null;
            isLongPress = false;
        }, { passive: false });
        
        cell.addEventListener('touchmove', (e) => {
            e.preventDefault();
            // Отменяем длительное нажатие при движении пальца
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        }, { passive: false });
    });
    
    // Обработка отпускания кнопки мыши
    document.addEventListener('mouseup', () => {
        isMouseDown = false;
        currentMouseAction = null;
        initialAction = null;
        shouldAdd = true;
    });
    
    // Обработка выхода мыши за пределы игрового поля
    document.addEventListener('mouseleave', () => {
        isMouseDown = false;
        currentMouseAction = null;
        initialAction = null;
        shouldAdd = true;
    });
};

const checkWin = (cells, solution) => {
    let isWin = true;
    cells.forEach(cell => {
        const row = parseInt(cell.dataset.row, 10);
        const col = parseInt(cell.dataset.col, 10);
        const expected = solution[row][col];
        const actual = cell.classList.contains('filled') ? 1 : 0;
            if (expected !== actual) isWin = false;
    });

    if (isWin) {
        const elapsedTime = getElapsedTime();
        
        // Сохраняем игру перед остановкой автосохранения
        saveGameData();
        
        showModal(t('game.victory') + ' ' + t('game.time', { time: elapsedTime }), '');
        stopAutoSave(); // Останавливаем автосохранение при победе
        addHighScore(currentNonogram.name, currentNonogram.difficulty, elapsedTime);
        saveToLibrary(currentNonogram.name, currentNonogram.solution, elapsedTime);
    }

    return isWin;
};

const showModal = (message, time) => {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        color: black;
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        max-width: 90vw;
        max-height: 90vh;
        overflow: auto;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;
    
    const modalText = document.createElement('p');
    modalText.style.cssText = `
        font-size: 18px;
        margin-bottom: 20px;
        line-height: 1.5;
    `;
    modalText.textContent = `${message} ${time}`; 
    
    const closeButton = document.createElement('button');
    closeButton.style.cssText = `
        padding: 12px 20px;
        border: none;
        border-radius: 8px;
        color: black;
        background: rgba(255, 255, 255, 0.9);
        border: 2px solid rgba(0, 0, 0, 0.2);
        cursor: pointer;
        transition: all 0.3s ease;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        min-width: 64px;
        min-height: 64px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-left: auto;
        margin-right: auto;
        font-size: 16px;
    `;
    closeButton.textContent = t('game.close');
    
    // Добавляем hover эффекты
    closeButton.addEventListener('mouseenter', () => {
        closeButton.style.background = 'rgba(255, 255, 255, 1)';
        closeButton.style.transform = 'translateY(-2px) scale(1.05)';
        closeButton.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.2)';
    });
    
    closeButton.addEventListener('mouseleave', () => {
        closeButton.style.background = 'rgba(255, 255, 255, 0.9)';
        closeButton.style.transform = 'translateY(0) scale(1)';
        closeButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
    });
    
    closeButton.addEventListener('mousedown', () => {
        closeButton.style.transform = 'translateY(0) scale(0.98)';
        closeButton.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.15)';
    });
    
    closeButton.addEventListener('mouseup', () => {
        closeButton.style.transform = 'translateY(-2px) scale(1.05)';
        closeButton.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.2)';
    });
    
    closeButton.addEventListener('click', () => {
        overlay.remove();
    });

    modal.appendChild(modalText);
    modal.appendChild(closeButton);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
};

// Функция для показа модального окна подсказки
export const showHintModal = () => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        color: black;
        padding: 30px;
        border-radius: 10px;
        text-align: center;
        max-width: 500px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;

    const modalTitle = document.createElement('h2');
    modalTitle.style.cssText = `
        font-size: 24px;
        margin-bottom: 20px;
        color: black;
        background: transparent;
    `;
    modalTitle.textContent = t('hint.title');

    const modalText = document.createElement('div');
    modalText.style.cssText = `
        font-size: 16px;
        margin-bottom: 20px;
        line-height: 1.5;
    `;
    modalText.innerHTML = `
        <p><strong>${t('hint.description')}</strong></p>
        <p>${t('hint.how_it_works')}</p>
        <p>🎯 <strong>${t('hint.instructions')}</strong></p>
        <ul style="text-align: left; margin: 15px 0;">
            <li>${t('hint.step1')}</li>
            <li>${t('hint.step2')}</li>
            <li>${t('hint.step3')}</li>
            <li>${t('hint.step4')}</li>
        </ul>
        <p style="color: #666; font-size: 14px; margin-top: 15px;">
            💡 <strong>${t('hint.tip')}</strong>
        </p>
    `;

    const hintCountContainer = document.createElement('div');
    hintCountContainer.style.cssText = `
        margin: 20px 0;
        display: flex;
        justify-content: center;
        gap: 10px;
        flex-wrap: wrap;
    `;

    const hintCountLabel = document.createElement('label');
    hintCountLabel.style.cssText = `
        font-size: 16px;
        font-weight: bold;
        margin-right: 10px;
    `;
    hintCountLabel.textContent = t('hint.cells_count');

    const hintCountSelect = document.createElement('select');
    hintCountSelect.style.cssText = `
        padding: 8px 12px;
        border: 2px solid #ddd;
        border-radius: 5px;
        font-size: 16px;
        background: white;
    `;

    for (let i = 1; i <= 5; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        hintCountSelect.appendChild(option);
    }

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        gap: 15px;
        justify-content: center;
        margin-top: 20px;
    `;

    const watchAdBtn = document.createElement('button');
    watchAdBtn.style.cssText = `
        padding: 12px 20px;
        border: none;
        border-radius: 8px;
        color: black;
        background: rgba(255, 255, 255, 0.9);
        border: 2px solid rgba(0, 0, 0, 0.2);
        cursor: pointer;
        transition: all 0.3s ease;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        min-width: 64px;
        min-height: 64px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
    `;
    watchAdBtn.textContent = '📺 ' + t('hint.watch_ad');
    watchAdBtn.addEventListener('click', async () => {
        const count = parseInt(hintCountSelect.value);
        
        // Показываем индикатор загрузки
        watchAdBtn.textContent = t('hint.loading');
        watchAdBtn.disabled = true;
        
        try {
            // Показываем рекламу через Яндекс.Игры SDK
            const rewarded = await showRewardedAd();
            
            if (rewarded) {
                // Пользователь досмотрел рекламу до конца или тестовый режим
                giveHint(count);
                showModal(t('hint.hint_applied'), 2000);
            } else {
                // Пользователь закрыл рекламу
                showModal(t('hint.ad_not_watched'), 3000);
            }
        } catch (error) {
            console.error('Ошибка показа рекламы:', error);
            // В тестовом режиме все равно даем подсказку
            if (error && (error.toString().includes('test') || error.toString().includes('development') || error.toString().includes('unavailable'))) {
                console.log('Тестовый режим: выдаем подсказку несмотря на ошибку');
                giveHint(count);
                showModal(t('hint.test_mode'), 2000);
            } else {
                showModal(t('hint.ad_error'), 3000);
            }
        } finally {
            // Восстанавливаем кнопку
            watchAdBtn.textContent = '📺 ' + t('hint.watch_ad');
            watchAdBtn.disabled = false;
            document.body.removeChild(overlay);
        }
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.style.cssText = `
        padding: 12px 20px;
        border: none;
        border-radius: 8px;
        color: black;
        background: rgba(255, 255, 255, 0.9);
        border: 2px solid rgba(0, 0, 0, 0.2);
        cursor: pointer;
        transition: all 0.3s ease;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        min-width: 64px;
        min-height: 64px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
    `;
    cancelBtn.textContent = t('game.cancel');
    cancelBtn.addEventListener('click', () => {
        document.body.removeChild(overlay);
    });

    hintCountContainer.appendChild(hintCountLabel);
    hintCountContainer.appendChild(hintCountSelect);
    buttonContainer.appendChild(watchAdBtn);
    buttonContainer.appendChild(cancelBtn);

    modal.appendChild(modalTitle);
    modal.appendChild(modalText);
    modal.appendChild(hintCountContainer);
    modal.appendChild(buttonContainer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
};

// Функция для проверки и зачеркивания полностью заполненных подсказок
const checkAndMarkCompletedClues = () => {
    if (!currentNonogram || !currentNonogram.solution) return;

    const cells = document.querySelectorAll('.grid .cell');
    const solution = currentNonogram.solution;
    const rows = solution.length;
    const cols = solution[0].length;

    // Проверяем строки
    for (let row = 0; row < rows; row++) {
        const rowClues = document.querySelectorAll(`.row-clues .clue:nth-child(${row + 1}) .clue-number`);
        if (rowClues.length === 0) continue;

        // Анализируем подсказки для строки
        const rowSolution = solution[row];
        const clueValues = Array.from(rowClues).map(clue => parseInt(clue.dataset.value));
        
        // Проверяем, соответствует ли заполнение подсказкам
        let currentClueIndex = 0;
        let currentBlockLength = 0;
        let isInBlock = false;
        
        for (let col = 0; col < cols; col++) {
            const cellIndex = row * cols + col;
            const cell = cells[cellIndex];
            const isFilled = cell.classList.contains('filled');
            
            if (isFilled && !isInBlock) {
                // Начало нового блока
                isInBlock = true;
                currentBlockLength = 1;
            } else if (isFilled && isInBlock) {
                // Продолжение блока
                currentBlockLength++;
            } else if (!isFilled && isInBlock) {
                // Конец блока
                if (currentClueIndex < clueValues.length && currentBlockLength === clueValues[currentClueIndex]) {
                    // Блок соответствует подсказке
                    rowClues[currentClueIndex].classList.add('completed');
                    currentClueIndex++;
                }
                isInBlock = false;
                currentBlockLength = 0;
            }
        }
        
        // Проверяем последний блок в строке
        if (isInBlock && currentClueIndex < clueValues.length && currentBlockLength === clueValues[currentClueIndex]) {
            rowClues[currentClueIndex].classList.add('completed');
        }
    }

    // Проверяем столбцы
    for (let col = 0; col < cols; col++) {
        const colClues = document.querySelectorAll(`.col-clues .clue:nth-child(${col + 1}) .clue-number`);
        if (colClues.length === 0) continue;

        // Анализируем подсказки для столбца
        const clueValues = Array.from(colClues).map(clue => parseInt(clue.dataset.value));
        
        // Проверяем, соответствует ли заполнение подсказкам
        let currentClueIndex = 0;
        let currentBlockLength = 0;
        let isInBlock = false;
        
        for (let row = 0; row < rows; row++) {
            const cellIndex = row * cols + col;
            const cell = cells[cellIndex];
            const isFilled = cell.classList.contains('filled');
            
            if (isFilled && !isInBlock) {
                // Начало нового блока
                isInBlock = true;
                currentBlockLength = 1;
            } else if (isFilled && isInBlock) {
                // Продолжение блока
                currentBlockLength++;
            } else if (!isFilled && isInBlock) {
                // Конец блока
                if (currentClueIndex < clueValues.length && currentBlockLength === clueValues[currentClueIndex]) {
                    // Блок соответствует подсказке
                    colClues[currentClueIndex].classList.add('completed');
                    currentClueIndex++;
                }
                isInBlock = false;
                currentBlockLength = 0;
            }
        }
        
        // Проверяем последний блок в столбце
        if (isInBlock && currentClueIndex < clueValues.length && currentBlockLength === clueValues[currentClueIndex]) {
            colClues[currentClueIndex].classList.add('completed');
        }
    }
};

// Функция для выдачи подсказки
const giveHint = (count) => {
    if (!currentNonogram || !currentNonogram.solution) {
        showModal(t('hint.nonogram_not_loaded'), 3000);
        return;
    }

    const cells = document.querySelectorAll('.grid .cell');
    const solution = currentNonogram.solution;
    const rows = solution.length;
    const cols = solution[0].length;

    // Находим все незаполненные правильные диапазоны
    const ranges = [];
    
    // Проверяем строки
    for (let row = 0; row < rows; row++) {
        let startCol = -1;
        for (let col = 0; col < cols; col++) {
            const cellIndex = row * cols + col;
            const cell = cells[cellIndex];
            
            if (solution[row][col] === 1 && !cell.classList.contains('filled')) {
                if (startCol === -1) {
                    startCol = col;
                }
            } else {
                if (startCol !== -1) {
                    ranges.push({
                        type: 'row',
                        row: row,
                        start: startCol,
                        end: col - 1,
                        length: col - startCol
                    });
                    startCol = -1;
                }
            }
        }
        // Проверяем диапазон в конце строки
        if (startCol !== -1) {
            ranges.push({
                type: 'row',
                row: row,
                start: startCol,
                end: cols - 1,
                length: cols - startCol
            });
        }
    }
    
    // Проверяем столбцы
    for (let col = 0; col < cols; col++) {
        let startRow = -1;
        for (let row = 0; row < rows; row++) {
            const cellIndex = row * cols + col;
            const cell = cells[cellIndex];
            
            if (solution[row][col] === 1 && !cell.classList.contains('filled')) {
                if (startRow === -1) {
                    startRow = row;
                }
            } else {
                if (startRow !== -1) {
                    ranges.push({
                        type: 'col',
                        col: col,
                        start: startRow,
                        end: row - 1,
                        length: row - startRow
                    });
                    startRow = -1;
                }
            }
        }
        // Проверяем диапазон в конце столбца
        if (startRow !== -1) {
            ranges.push({
                type: 'col',
                col: col,
                start: startRow,
                end: rows - 1,
                length: rows - startRow
            });
        }
    }

    if (ranges.length === 0) {
        showModal('🎉 Поздравляем! Все клетки уже заполнены правильно!', 3000);
        return;
    }

    // Сортируем диапазоны по длине (от больших к меньшим)
    ranges.sort((a, b) => b.length - a.length);

    // Выбираем диапазоны для подсказки
    let totalCells = 0;
    const selectedRanges = [];
    
    for (const range of ranges) {
        if (totalCells + range.length <= count) {
            selectedRanges.push(range);
            totalCells += range.length;
        } else if (range.length <= count) {
            // Если диапазон помещается в оставшееся количество
            selectedRanges.push(range);
            totalCells += range.length;
        }
        
        if (totalCells >= count) break;
    }

    // Заполняем выбранные диапазоны
    selectedRanges.forEach(range => {
        if (range.type === 'row') {
            for (let col = range.start; col <= range.end; col++) {
                const cellIndex = range.row * cols + col;
                const cell = cells[cellIndex];
                cell.classList.remove('crossed');
                cell.classList.add('filled');
            }
        } else if (range.type === 'col') {
            for (let row = range.start; row <= range.end; row++) {
                const cellIndex = row * cols + range.col;
                const cell = cells[cellIndex];
                cell.classList.remove('crossed');
                cell.classList.add('filled');
            }
        }
    });

    // Проверяем и зачеркиваем полностью заполненные подсказки
    checkAndMarkCompletedClues();

    // Показываем сообщение о подсказке
    showModal(t('hint.applied', { cells: totalCells, ranges: selectedRanges.length }), 2000);

    // Отмечаем, что состояние игры изменилось
    markGameDirty();
    
    // Проверяем победу
    checkWin(cells, solution);
};

// Функция для показа решения нонограммы
export const showSolution = async () => {
    if (!currentNonogram || !currentNonogram.solution) {
        showModal(t('game.solution_unavailable'), '');
        return;
    }

    // Показываем рекламу за вознаграждение перед показом решения
    let adShown = false;
    
    try {
        if (isRewardedAdAvailable()) {
            await showRewardedAd();
            adShown = true;
        }
    } catch (error) {
        console.log('Реклама недоступна или была отменена:', error);
    }
    
    // Если реклама не была показана, показываем окно AdNotAvailableNow и выходим
    if (!adShown) {
        showModal(t('hint.ad_not_available'), '');
        return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.cssText = `
        background: var(--modal-background, white);
        color: var(--modal-text-color, black);
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        max-width: 90vw;
        max-height: 90vh;
        overflow: auto;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;

    const modalTitle = document.createElement('h2');
    modalTitle.style.cssText = `
        text-align: center;
        margin-bottom: 20px;
        font-size: 24px;
        font-weight: 600;
        color: var(--modal-text-color, black);
        background: transparent;
    `;
    modalTitle.textContent = currentNonogram.name;

    const solutionContainer = document.createElement('div');
    solutionContainer.style.cssText = `
        display: inline-block;
        border: 2px solid #333;
        background: white;
        padding: 10px;
        margin: 10px 0;
    `;

    const solution = currentNonogram.solution;
    const rows = solution.length;
    const cols = solution[0].length;

    // Создаем сетку решения
    for (let row = 0; row < rows; row++) {
        const rowDiv = document.createElement('div');
        rowDiv.style.cssText = 'display: flex; justify-content: center;';
        
        for (let col = 0; col < cols; col++) {
            const cell = document.createElement('div');
            cell.style.cssText = `
                width: 20px;
                height: 20px;
                border: 1px solid #ccc;
                background: ${solution[row][col] ? '#333' : 'white'};
                margin: 0;
            `;
            rowDiv.appendChild(cell);
        }
        solutionContainer.appendChild(rowDiv);
    }

    const closeButton = document.createElement('button');
    closeButton.style.cssText = `
        padding: 12px 20px;
        border: none;
        border-radius: 8px;
        color: black;
        background: rgba(255, 255, 255, 0.9);
        border: 2px solid rgba(0, 0, 0, 0.2);
        cursor: pointer;
        transition: all 0.3s ease;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        min-width: 64px;
        min-height: 64px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: 20px;
        margin-left: auto;
        margin-right: auto;
        font-size: 16px;
    `;
    closeButton.textContent = t('game.close');
    
    // Добавляем hover эффекты
    closeButton.addEventListener('mouseenter', () => {
        closeButton.style.background = 'rgba(255, 255, 255, 1)';
        closeButton.style.transform = 'translateY(-2px) scale(1.05)';
        closeButton.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.2)';
    });
    
    closeButton.addEventListener('mouseleave', () => {
        closeButton.style.background = 'rgba(255, 255, 255, 0.9)';
        closeButton.style.transform = 'translateY(0) scale(1)';
        closeButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
    });
    
    closeButton.addEventListener('mousedown', () => {
        closeButton.style.transform = 'translateY(0) scale(0.98)';
        closeButton.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.15)';
    });
    
    closeButton.addEventListener('mouseup', () => {
        closeButton.style.transform = 'translateY(-2px) scale(1.05)';
        closeButton.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.2)';
    });
    
    closeButton.addEventListener('click', () => {
        overlay.remove();
    });

    modal.appendChild(modalTitle);
    modal.appendChild(solutionContainer);
    modal.appendChild(closeButton);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
};

export const showHighScoresModal = () => {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        color: black;
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        max-width: 90vw;
        max-height: 90vh;
        overflow: auto;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;

    const modalTitle = document.createElement('h2');
    modalTitle.style.cssText = `
        text-align: center;
        margin-bottom: 20px;
        font-size: 24px;
        font-weight: 600;
        color: black;
        background: transparent;
    `;
    modalTitle.textContent = t('high_scores.title');

    const highScoresTable = document.createElement('table');
    highScoresTable.className = 'high-scores-table';

    const headerRow = document.createElement('tr');
    [t('high_scores.puzzle'), t('high_scores.time')].forEach(headerText => {
        const header = document.createElement('th');
        header.textContent = headerText;
        headerRow.appendChild(header);
    });
    highScoresTable.appendChild(headerRow);

    const highScores = JSON.parse(localStorage.getItem('highScores')) || [];
    highScores.forEach(score => {
        const row = document.createElement('tr');
        ['nonogramName', 'time'].forEach(key => {
            const cell = document.createElement('td');
            cell.textContent = score[key];
            row.appendChild(cell);
        });
        highScoresTable.appendChild(row);
    });

    modal.appendChild(modalTitle);
    modal.appendChild(highScoresTable);

    const closeButton = document.createElement('button');
    closeButton.style.cssText = `
        padding: 12px 20px;
        border: none;
        border-radius: 8px;
        color: black;
        background: rgba(255, 255, 255, 0.9);
        border: 2px solid rgba(0, 0, 0, 0.2);
        cursor: pointer;
        transition: all 0.3s ease;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        min-width: 64px;
        min-height: 64px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: 20px;
        margin-left: auto;
        margin-right: auto;
        font-size: 16px;
    `;
    closeButton.textContent = t('game.close');
    
    // Добавляем hover эффекты
    closeButton.addEventListener('mouseenter', () => {
        closeButton.style.background = 'rgba(255, 255, 255, 1)';
        closeButton.style.transform = 'translateY(-2px) scale(1.05)';
        closeButton.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.2)';
    });
    
    closeButton.addEventListener('mouseleave', () => {
        closeButton.style.background = 'rgba(255, 255, 255, 0.9)';
        closeButton.style.transform = 'translateY(0) scale(1)';
        closeButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
    });
    
    closeButton.addEventListener('mousedown', () => {
        closeButton.style.transform = 'translateY(0) scale(0.98)';
        closeButton.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.15)';
    });
    
    closeButton.addEventListener('mouseup', () => {
        closeButton.style.transform = 'translateY(-2px) scale(1.05)';
        closeButton.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.2)';
    });
    
    closeButton.addEventListener('click', () => {
        overlay.remove();
    });
    
    modal.appendChild(closeButton);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
};

const addHighScore = (nonogramName, difficulty, time) => {
    const highScores = JSON.parse(localStorage.getItem('highScores')) || [];
    const newScore = {
        nonogramName: nonogramName,
        time: time
    };
    
    highScores.unshift(newScore);
    
    if (highScores.length > 5) {
        highScores.pop();
    }
    
    localStorage.setItem('highScores', JSON.stringify(highScores));
};const saveToLibrary = (nonogramName, solution, time) => {
    const library = JSON.parse(localStorage.getItem('nonogramLibrary')) || [];
    
    // Проверяем, не решена ли уже эта нонограмма
    const existingIndex = library.findIndex(item => item.name === nonogramName);
    
    const solvedNonogram = {
        name: nonogramName,
        solution: solution,
        solvedAt: new Date().toISOString(),
        time: time
    };
    
    if (existingIndex !== -1) {
        // Обновляем существующую запись
        library[existingIndex] = solvedNonogram;
    } else {
        // Добавляем новую запись в начало
        library.unshift(solvedNonogram);
    }
    
    localStorage.setItem('nonogramLibrary', JSON.stringify(library));
};

export const showLibrary = () => {
    const library = JSON.parse(localStorage.getItem('nonogramLibrary')) || [];
    
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        color: black;
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        max-width: 1200px;
        width: 98%;
        max-height: 90vh;
        overflow: auto;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;
    
    const modalTitle = document.createElement('h2');
    modalTitle.style.cssText = `
        text-align: center;
        margin-bottom: 20px;
        font-size: 24px;
        font-weight: 600;
        color: black;
        background: transparent;
    `;
    modalTitle.textContent = t('library.title');
    
    modal.appendChild(modalTitle);
    
    if (library.length === 0) {
        const noItems = document.createElement('p');
        noItems.textContent = t('library.empty');
        noItems.style.textAlign = 'center';
        noItems.style.color = '#666';
        modal.appendChild(noItems);
    } else {
        const libraryGrid = document.createElement('div');
        libraryGrid.style.display = 'grid';
        libraryGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(150px, 1fr))';
        libraryGrid.style.gap = '15px';
        libraryGrid.style.maxHeight = '800px';
        libraryGrid.style.overflowY = 'auto';
        libraryGrid.style.padding = '20px';
        
        library.forEach(item => {
            const nonogramCard = document.createElement('div');
            nonogramCard.className = 'library-card';
            nonogramCard.style.borderRadius = '8px';
            nonogramCard.style.padding = '10px';
            nonogramCard.style.textAlign = 'center';
            nonogramCard.style.cursor = 'pointer';
            nonogramCard.style.transition = 'transform 0.2s';
            nonogramCard.style.backgroundColor = '#f5f5f5';
            nonogramCard.style.color = 'black';
            nonogramCard.style.border = '1px solid #ddd';
            
            nonogramCard.addEventListener('mouseenter', () => {
                nonogramCard.style.transform = 'scale(1.05)';
                nonogramCard.style.backgroundColor = '#e0e0e0';
            });
            
            nonogramCard.addEventListener('mouseleave', () => {
                nonogramCard.style.transform = 'scale(1)';
                nonogramCard.style.backgroundColor = '#f5f5f5';
            });
            
            // Добавляем обработчик клика для загрузки нонограммы
            nonogramCard.addEventListener('click', () => {
                // Находим нонограмму по имени
                const nonogram = Object.values(nonograms).find(n => n.name === item.name);
                if (nonogram) {
                    // Закрываем модальное окно библиотеки
                    overlay.remove();
                    
                    // Загружаем нонограмму
                    window.currentNonogram = nonogram;
                    
                    // Удаляем старое игровое поле
                    const oldField = document.querySelector('.nonogram-container');
                    if (oldField) {
                        const oldWrapper = oldField.closest('.nonogram-wrapper');
                        if (oldWrapper) {
                            oldWrapper.remove();
                        } else {
                            oldField.remove();
                        }
                    }
                    
                    // Создаем новое игровое поле
                    const newField = createGameField(nonogram);
                    const mainContainer = document.querySelector('.main-container');
                    mainContainer.appendChild(newField);
                    
                    // Сбрасываем масштаб и позицию
                    currentScale = 1;
                    currentTranslateX = 0;
                    currentTranslateY = 0;
                    

                    
                    // Инициализируем игровое поле
                    initGameField();
                    
                    // Добавляем подсказки
                    addHint();
                    
                    // Сбрасываем таймер для новой игры
                    resetTimer();
                    
                    // Инициализируем управление масштабированием
                    setTimeout(() => {
                        initZoomControls();
                        centerNonogram();
                        // Инициализируем клики по подсказкам
                        initClueClickHandlers();
                        
                        // Инициализируем таймер
                        if (window.timerButton) {
                            setTimerDisplay(window.timerButton);
                            initTimer();
                        }
                        
                        // Применяем трансформацию
                        applyTransform();
                    }, 100);
                    
                    // Запускаем автосохранение для новой игры
                    startAutoSave();
                    
                    // Обновляем название в кнопке выбора карты
                    const mapSelectButton = document.querySelector('.map-btn');
                    if (mapSelectButton) {
                        mapSelectButton.querySelector('span:first-child').textContent = nonogram.name;
                    }
                    

                    
                    // Воспроизводим звук
                    playSound('button-on.mp3');
                }
            });
            
            // Создаем миниатюру решения
            const thumbnail = document.createElement('div');
            thumbnail.className = 'library-thumbnail';
            thumbnail.style.display = 'grid';
            thumbnail.style.gridTemplateColumns = `repeat(${item.solution[0].length}, 1fr)`;
            thumbnail.style.gap = '1px';
            thumbnail.style.width = '100px';
            thumbnail.style.height = '100px';
            thumbnail.style.margin = '0 auto 10px';
            thumbnail.style.border = '1px solid #ddd';

            
            item.solution.forEach(row => {
                row.forEach(cell => {
                    const cellElement = document.createElement('div');
                    cellElement.style.width = '100%';
                    cellElement.style.height = '100%';
                    cellElement.style.backgroundColor = cell === 1 ? '#000' : '#fff';
    
                    thumbnail.appendChild(cellElement);
                });
            });
            
            const name = document.createElement('div');
            name.className = 'library-name';
            name.textContent = t(`nonograms.${item.name.toLowerCase()}`) || item.name;
            name.style.fontWeight = 'bold';
            name.style.marginBottom = '5px';
            name.style.color = 'black';
            name.style.textShadow = '0 0 2px rgba(255, 255, 255, 0.8)';
            
            const time = document.createElement('div');
            time.className = 'library-time';
            time.textContent = t('library.time', { time: item.time });
            time.style.fontSize = '12px';
            time.style.color = '#333';
            time.style.textShadow = '0 0 2px rgba(255, 255, 255, 0.8)';
            
            const date = document.createElement('div');
            date.className = 'library-date';
            date.textContent = t('library.date', { date: new Date(item.solvedAt).toLocaleDateString() });
            date.style.fontSize = '10px';
            date.style.color = '#555';
            date.style.textShadow = '0 0 2px rgba(255, 255, 255, 0.8)';
            
            nonogramCard.appendChild(thumbnail);
            nonogramCard.appendChild(name);
            nonogramCard.appendChild(time);
            nonogramCard.appendChild(date);
            
            libraryGrid.appendChild(nonogramCard);
        });
        
        modal.appendChild(libraryGrid);
    }
    
    const closeButton = document.createElement('button');
    closeButton.style.cssText = `
        padding: 12px 20px;
        border: none;
        border-radius: 8px;
        color: black;
        background: rgba(255, 255, 255, 0.9);
        border: 2px solid rgba(0, 0, 0, 0.2);
        cursor: pointer;
        transition: all 0.3s ease;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        min-width: 64px;
        min-height: 64px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: 20px;
        margin-left: auto;
        margin-right: auto;
        font-size: 16px;
    `;
    closeButton.textContent = t('game.close');
    
    // Добавляем hover эффекты
    closeButton.addEventListener('mouseenter', () => {
        closeButton.style.background = 'rgba(255, 255, 255, 1)';
        closeButton.style.transform = 'translateY(-2px) scale(1.05)';
        closeButton.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.2)';
    });
    
    closeButton.addEventListener('mouseleave', () => {
        closeButton.style.background = 'rgba(255, 255, 255, 0.9)';
        closeButton.style.transform = 'translateY(0) scale(1)';
        closeButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
    });
    
    closeButton.addEventListener('mousedown', () => {
        closeButton.style.transform = 'translateY(0) scale(0.98)';
        closeButton.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.15)';
    });
    
    closeButton.addEventListener('mouseup', () => {
        closeButton.style.transform = 'translateY(-2px) scale(1.05)';
        closeButton.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.2)';
    });
    
    closeButton.addEventListener('click', () => {
        overlay.remove();
    });
    
    modal.appendChild(closeButton);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
};

// Функция для инициализации кликов по цифрам в подсказках
const initClueClickHandlers = () => {
    const clueNumbers = document.querySelectorAll('.clue-number');
    console.log('Инициализация кликов по цифрам в подсказках, найдено:', clueNumbers.length);
    
    clueNumbers.forEach((numberElement, index) => {
        // Удаляем старые обработчики, если они есть
        numberElement.removeEventListener('click', numberElement._clueClickHandler);
        
        // Создаем новый обработчик
        numberElement._clueClickHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Клик по цифре в подсказке:', index, 'значение:', numberElement.dataset.value);
            numberElement.classList.toggle('completed');
            playSound('button-on.mp3');
            markGameDirty();
        };
        
        numberElement.addEventListener('click', numberElement._clueClickHandler);
        
        // Добавляем курсор pointer для цифр
        numberElement.style.cursor = 'pointer';
        numberElement.style.padding = '2px 4px';
        numberElement.style.borderRadius = '3px';
        numberElement.style.transition = 'all 0.2s ease';
        
        // Добавляем hover эффект
        numberElement.addEventListener('mouseenter', () => {
            if (!numberElement.classList.contains('completed')) {
                numberElement.style.backgroundColor = document.body.classList.contains('dark') ? '#555' : '#e0e0e0';
            }
        });
        
        numberElement.addEventListener('mouseleave', () => {
            if (!numberElement.classList.contains('completed')) {
                numberElement.style.backgroundColor = 'transparent';
            }
        });
    });
};


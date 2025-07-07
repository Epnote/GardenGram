import { createGameField } from './modules/gameField.js';
import { createGameInterface } from './modules/gameInterface.js';
import { nonograms } from './modules/nonograms.js';
import { playSound } from './modules/soundControl.js';
import { updateCellStyles, applySavedTheme } from './modules/themeControl.js';


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
        const gameData = {
            nonogramName: currentNonogram.name,
            cellStates: cellStates,
            elapsedTime: '00:00'
        };
        localStorage.setItem('savedGame', JSON.stringify(gameData));

    } catch (error) {
        console.error('Error auto-saving game:', error);
    }
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
    hint.innerHTML = `
        <p>💡 <strong>Управление:</strong></p>
        <p>• Левый клик - заполнить/очистить клетку</p>
        <p>• Правый клик - поставить/убрать крестик</p>
        <p>• Зажмите кнопку мыши и ведите для быстрого заполнения</p>
    `;
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
            

            

            

            addHint();
            
            const mapSelectButton = document.querySelector('.map-btn');
            if (mapSelectButton) {
                mapSelectButton.querySelector('span:first-child').textContent = currentNonogram.name;
            }
            
            return true; // Сохранение было загружено
        }
    }
    
    return false; // Сохранение не найдено
};

document.addEventListener('DOMContentLoaded', () => {
    // Удаляем старый интерфейс, если он есть
    const old = document.querySelector('.main-container');
    if (old) old.remove();

    // Применяем сохранённую тему
    applySavedTheme();
    
    mainContainer = createGameInterface();
    
    // Сначала добавляем контейнер в DOM
    document.body.appendChild(mainContainer);
    
    // Пытаемся загрузить сохраненную игру
    const savedGameLoaded = autoLoadGame();
    
    // Если сохранение не найдено, создаем новую игру
    if (!savedGameLoaded) {
        let gameField = createGameField(currentNonogram);
        mainContainer.appendChild(gameField);
        addHint();
    }
    
    // Запускаем автосохранение каждые 3 секунды
    startAutoSave();

    const resetGame = () => {
        const cells = document.querySelectorAll('.grid .cell');
        cells.forEach(cell => {
            cell.classList.remove('filled');
            cell.classList.remove('crossed');
        });
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
        const selectedLevel = getRandomLevel();
        const selectedNonogram = getRandomNonogram(selectedLevel);
        if (selectedNonogram) {
            window.currentNonogram = selectedNonogram;
            const oldField = document.querySelector('.nonogram-container');
            if (oldField) oldField.remove();
            const newField = createGameField(selectedNonogram);
            mainContainer.appendChild(newField);
            initGameField();
            addHint();
            
            // Сохраняем прогресс сразу при переключении на новую игру
            markGameDirty();
            saveGameData();
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
        }
        
        const solution = currentNonogram.solution;
        if (checkWin(cells, solution)) {
            playSound('victory.mp3');
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
        playSound('victory.mp3');
        showModal('Great! You have solved the nonogram!', '');
        stopAutoSave(); // Останавливаем автосохранение при победе
        addHighScore(currentNonogram.name, currentNonogram.difficulty, '00:00');
        saveToLibrary(currentNonogram.name, currentNonogram.solution, '00:00');
    }

    return isWin;
};

const showModal = (message, time) => {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'modal';
    
    const modalText = document.createElement('p');
    modalText.className = 'modal-text';
    modalText.textContent = `${message} ${time}`; 
    
    const closeButton = document.createElement('button');
    closeButton.className = 'modal-close-btn';
    closeButton.textContent = 'OK';
    
    closeButton.addEventListener('click', () => {
        modalOverlay.remove();
    });

    modal.appendChild(modalText);
    modal.appendChild(closeButton);
    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);
};

export const showHighScoresModal = () => {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'high-scores-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'high-scores-modal';

    const modalTitle = document.createElement('h2');
    modalTitle.textContent = 'Last 5 Games';
    modal.appendChild(modalTitle);

    const highScoresTable = document.createElement('table');
    highScoresTable.className = 'high-scores-table';

    const headerRow = document.createElement('tr');
    ['Nonogram', 'Difficulty', 'Time'].forEach(headerText => {
        const header = document.createElement('th');
        header.textContent = headerText;
        headerRow.appendChild(header);
    });
    highScoresTable.appendChild(headerRow);

    const highScores = JSON.parse(localStorage.getItem('highScores')) || [];
    highScores.forEach(score => {
        const row = document.createElement('tr');
        ['nonogramName', 'difficulty', 'time'].forEach(key => {
            const cell = document.createElement('td');
            cell.textContent = score[key];
            row.appendChild(cell);
        });
        highScoresTable.appendChild(row);
    });

    modal.appendChild(highScoresTable);

    const closeButton = document.createElement('button');
    closeButton.className = 'high-scores-modal-close-btn';
    closeButton.textContent = 'Close';
    closeButton.addEventListener('click', () => {
        modalOverlay.remove();
    });
    modal.appendChild(closeButton);
    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);
};

const addHighScore = (nonogramName, difficulty, time) => {
    const highScores = JSON.parse(localStorage.getItem('highScores')) || [];
    const newScore = {
        nonogramName: nonogramName,
        difficulty: difficulty,
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
    
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.maxWidth = '800px';
    modal.style.width = '90%';
    
    const modalTitle = document.createElement('h2');
    modalTitle.textContent = 'Library of Solved Nonograms';
    modalTitle.style.marginBottom = '20px';
    modal.appendChild(modalTitle);
    
    if (library.length === 0) {
        const noItems = document.createElement('p');
        noItems.textContent = 'No solved nonograms yet. Solve some puzzles to see them here!';
        noItems.style.textAlign = 'center';
        noItems.style.color = document.body.classList.contains('dark') ? '#ccc' : '#666';
        modal.appendChild(noItems);
    } else {
        const libraryGrid = document.createElement('div');
        libraryGrid.style.display = 'grid';
        libraryGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(150px, 1fr))';
        libraryGrid.style.gap = '15px';
        libraryGrid.style.maxHeight = '400px';
        libraryGrid.style.overflowY = 'auto';
        
        library.forEach(item => {
            const nonogramCard = document.createElement('div');
            nonogramCard.className = 'library-card';
            nonogramCard.style.borderRadius = '8px';
            nonogramCard.style.padding = '10px';
            nonogramCard.style.textAlign = 'center';
            nonogramCard.style.cursor = 'pointer';
            nonogramCard.style.transition = 'transform 0.2s';
            nonogramCard.style.backgroundColor = document.body.classList.contains('dark') ? '#444' : '#f5f5f5';
            nonogramCard.style.color = document.body.classList.contains('dark') ? 'white' : 'black';
            nonogramCard.style.border = document.body.classList.contains('dark') ? '1px solid #666' : '1px solid #ddd';
            
            nonogramCard.addEventListener('mouseenter', () => {
                nonogramCard.style.transform = 'scale(1.05)';
                nonogramCard.style.backgroundColor = document.body.classList.contains('dark') ? '#555' : '#e0e0e0';
            });
            
            nonogramCard.addEventListener('mouseleave', () => {
                nonogramCard.style.transform = 'scale(1)';
                nonogramCard.style.backgroundColor = document.body.classList.contains('dark') ? '#444' : '#f5f5f5';
            });
            
            // Добавляем обработчик клика для загрузки нонограммы
            nonogramCard.addEventListener('click', () => {
                // Находим нонограмму по имени
                const nonogram = Object.values(nonograms).find(n => n.name === item.name);
                if (nonogram) {
                    // Закрываем модальное окно библиотеки
                    modalOverlay.remove();
                    
                    // Загружаем нонограмму
                    window.currentNonogram = nonogram;
                    
                    // Удаляем старое игровое поле
                    const oldField = document.querySelector('.nonogram-container');
                    if (oldField) oldField.remove();
                    
                    // Создаем новое игровое поле
                    const newField = createGameField(nonogram);
                    const mainContainer = document.querySelector('.main-container');
                    mainContainer.appendChild(newField);
                    

                    
                    // Инициализируем игровое поле
                    initGameField();
                    

                    
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
            thumbnail.style.border = document.body.classList.contains('dark') ? '1px solid #666' : '1px solid #ddd';

            
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
            name.textContent = item.name;
            name.style.fontWeight = 'bold';
            name.style.marginBottom = '5px';
            name.style.color = document.body.classList.contains('dark') ? 'white' : 'black';
            
            const time = document.createElement('div');
            time.className = 'library-time';
            time.textContent = `Time: ${item.time}`;
            time.style.fontSize = '12px';
            time.style.color = document.body.classList.contains('dark') ? '#ccc' : '#666';
            
            const date = document.createElement('div');
            date.className = 'library-date';
            date.textContent = new Date(item.solvedAt).toLocaleDateString();
            date.style.fontSize = '10px';
            date.style.color = document.body.classList.contains('dark') ? '#999' : '#999';
            
            nonogramCard.appendChild(thumbnail);
            nonogramCard.appendChild(name);
            nonogramCard.appendChild(time);
            nonogramCard.appendChild(date);
            
            libraryGrid.appendChild(nonogramCard);
        });
        
        modal.appendChild(libraryGrid);
    }
    
    const closeButton = document.createElement('button');
    closeButton.className = 'modal-close-btn';
    closeButton.textContent = 'Close';
    closeButton.style.marginTop = '20px';
    closeButton.addEventListener('click', () => {
        modalOverlay.remove();
    });
    
    modal.appendChild(closeButton);
    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);
};


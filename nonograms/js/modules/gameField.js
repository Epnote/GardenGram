export function createGameField(nonogram) {
    const gameField = document.createElement('div');
    gameField.className = 'nonogram-container';

    const colCluesContainer = document.createElement('div');
    colCluesContainer.className = 'col-clues';

    const rowCluesContainer = document.createElement('div');
    rowCluesContainer.className = 'row-clues';

    const grid = document.createElement('div');
    grid.className = 'grid';

    let cellSize;
    if (nonogram.size === 5) {
        cellSize = '50px';
    } else if (nonogram.size === 10) {
        cellSize = '30px';
    } else if (nonogram.size === 15) {
        cellSize = '25px';
    }

    grid.style.gridTemplateColumns = `repeat(${nonogram.size}, ${cellSize})`;
    grid.style.gridTemplateRows = `repeat(${nonogram.size}, ${cellSize})`;

    nonogram.colClues.forEach((clue) => {
        const clueElement = document.createElement('div');
        clueElement.className = 'clue';
        
        clueElement.style.minWidth = cellSize;
        clueElement.style.minHeight = `108px`;
        clue.forEach(number => {
            const numberElement = document.createElement('span');
            numberElement.textContent = number;
            clueElement.appendChild(numberElement);
        });
        
        colCluesContainer.appendChild(clueElement);
    });

    nonogram.rowClues.forEach((clue, index) => {
        const clueElement = document.createElement('div');
        clueElement.className = 'clue';
        clueElement.style.minWidth = `108px`;
        clueElement.style.minHeight = cellSize;
        clueElement.textContent = clue.join(' ');
        rowCluesContainer.appendChild(clueElement);
    });

    for (let row = 0; row < nonogram.size; row++) {
        const rowElement = document.createElement('div');
        rowElement.style.display = 'contents';
        for (let col = 0; col < nonogram.size; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;

            const isDarkTheme = document.body.classList.contains('dark');
            const borderColor = isDarkTheme ? 'white' : 'black';

            if ((col + 1) % 5 === 0) {
                cell.style.borderRight = `2px solid ${borderColor}`;
                cell.classList.toggle('cell-border-right');
            }
            if ((row + 1) % 5 === 0) {
                cell.style.borderBottom = `2px solid ${borderColor}`;
                cell.classList.toggle('cell-border-bottom');
            }
            if (col % 5 === 0 && col !== 0) {
                cell.style.borderLeft = `2px solid ${borderColor}`;
                cell.classList.toggle('cell-border-left');
            }
            if (row % 5 === 0 && row !== 0) {
                cell.style.borderTop = `2px solid ${borderColor}`;
                cell.classList.toggle('cell-border-top');
            }

            rowElement.appendChild(cell);
        }
        grid.appendChild(rowElement);
    }

    gameField.appendChild(colCluesContainer);
    gameField.appendChild(rowCluesContainer);
    gameField.appendChild(grid);

    return gameField;
}
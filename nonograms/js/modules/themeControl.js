export const toggleTheme = () => {
    document.body.classList.toggle('dark');
    updateCellStyles(document.querySelectorAll('.grid .cell'));
    
    // Сохраняем тему в localStorage
    const isDark = document.body.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    // Обновляем цвет и иконку темы
    const themeBtn = document.querySelector('.theme-btn');
    if (themeBtn) {
        themeBtn.style.color = isDark ? 'white' : '#333';
        themeBtn.textContent = isDark ? '☾' : '☀';
    }

    // Форсируем обновление толстых линий 5x5 только внутри .grid
    document.querySelectorAll('.grid .cell-border-right, .grid .cell-border-bottom, .grid .cell-border-left, .grid .cell-border-top')
      .forEach(cell => {
        ['cell-border-right', 'cell-border-bottom', 'cell-border-left', 'cell-border-top'].forEach(cls => {
          if (cell.classList.contains(cls)) {
            cell.classList.remove(cls);
            cell.classList.add(cls);
          }
        });
      });
};

export const applySavedTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
    } else {
        document.body.classList.remove('dark');
    }
    
    // Обновляем цвет и иконку темы
    const themeBtn = document.querySelector('.theme-btn');
    if (themeBtn) {
        const isDark = document.body.classList.contains('dark');
        themeBtn.style.color = isDark ? 'white' : '#333';
        themeBtn.textContent = isDark ? '☾' : '☀';
    }
};

export const updateCellStyles = (cells) => {
    cells.forEach(cell => {
        if (cell.classList.contains('filled')) {
            cell.classList.add('filled-dark');
        } else {
            cell.classList.remove('filled-dark');
        }


    });
};

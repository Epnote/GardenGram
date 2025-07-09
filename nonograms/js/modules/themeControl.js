export const toggleTheme = () => {
    document.body.classList.toggle('dark');
    updateCellStyles(document.querySelectorAll('.grid .cell'));
    
    // Сохраняем тему в localStorage
    const isDark = document.body.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    // Обновляем иконку темы
    const themeBtn = document.querySelector('.theme-btn');
    if (themeBtn) {
        themeBtn.innerHTML = isDark ? 
            '<img src="./images/UI/DarkTheme.png" alt="Theme" style="width: 48px; height: 48px;">' : 
            '<img src="./images/UI/LightTheme.png" alt="Theme" style="width: 48px; height: 48px;">';
    }
    
    // Обновляем цвет кнопки подсказки
    const hintBtn = document.querySelector('.hint-btn');
    if (hintBtn) {
        hintBtn.style.color = isDark ? '#34d399' : '#10b981';
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
    
    // Обновляем иконку темы
    const themeBtn = document.querySelector('.theme-btn');
    if (themeBtn) {
        const isDark = document.body.classList.contains('dark');
        themeBtn.innerHTML = isDark ? 
            '<img src="./images/UI/DarkTheme.png" alt="Theme" style="width: 48px; height: 48px;">' : 
            '<img src="./images/UI/LightTheme.png" alt="Theme" style="width: 48px; height: 48px;">';
    }
    
    // Обновляем цвет кнопки подсказки
    const hintBtn = document.querySelector('.hint-btn');
    if (hintBtn) {
        const isDark = document.body.classList.contains('dark');
        hintBtn.style.color = isDark ? '#34d399' : '#10b981';
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

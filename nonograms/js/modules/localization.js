// Модуль для работы с локализацией
let currentLocale = 'ru';
let translations = {};

// Загрузка переводов
export const loadTranslations = async (locale = 'ru') => {
    try {
        const response = await fetch(`./locales/${locale}.json`);
        
        if (!response.ok) {
            throw new Error(`Failed to load translations for ${locale}: ${response.status} ${response.statusText}`);
        }
        
        const text = await response.text();
        translations = JSON.parse(text);
        currentLocale = locale;
        
        // Сохраняем выбранную локаль в localStorage
        localStorage.setItem('locale', locale);
        
        return true;
    } catch (error) {
        console.error('❌ [LOCALIZATION] Error loading translations:', error);
        
        // Fallback на русский
        if (locale !== 'ru') {
            return await loadTranslations('ru');
        }
        return false;
    }
};

// Получение перевода по ключу
export const t = (key, params = {}) => {
    const keys = key.split('.');
    let value = translations;
    
    for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
            value = value[k];
        } else {
            console.warn(`⚠️ [LOCALIZATION] Translation key not found: ${key}`);
            return key; // Возвращаем ключ, если перевод не найден
        }
    }
    
    if (typeof value !== 'string') {
        console.warn(`⚠️ [LOCALIZATION] Translation value is not a string: ${key}`);
        return key;
    }
    
    // Заменяем параметры в строке
    const result = value.replace(/\{(\w+)\}/g, (match, param) => {
        return params[param] !== undefined ? params[param] : match;
    });
    
    return result;
};

// Установка локали
export const setLocale = async (locale) => {
    const success = await loadTranslations(locale);
    if (success) {
        // Обновляем интерфейс
        updateInterface();
    }
    return success;
};

// Получение текущей локали
export const getCurrentLocale = () => {
    return currentLocale;
};

// Переключение локали
export const toggleLocale = async () => {
    const newLocale = currentLocale === 'ru' ? 'en' : 'ru';
    return await setLocale(newLocale);
};

// Обновление интерфейса после смены локали
export const updateInterface = () => {
    // Обновляем заголовок страницы
    document.title = t('game.title');
    
    // Обновляем кнопки
    updateButtons();
    
    // Обновляем модальные окна, если они открыты
    updateModals();

    // Обновляем подсказку по управлению
    const controlHint = document.getElementById('control-hint');
    if (controlHint) {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
        const hintText = t(isMobile ? 'controls.mobile' : 'controls.desktop');
        controlHint.innerHTML = '<strong>' + hintText + '</strong>';
    } else {
        console.warn('⚠️ [LOCALIZATION] Control hint element not found');
    }
};

// Обновление кнопок
const updateButtons = () => {
    // Кнопка сброса
    const resetBtn = document.querySelector('.reset-btn');
    if (resetBtn) {
        resetBtn.title = t('buttons.reset');
    }
    
    // Кнопка случайной нонограммы
    const randomBtn = document.querySelector('.random-btn');
    if (randomBtn) {
        randomBtn.title = t('buttons.random');
    }
    
    // Кнопка решения
    const solutionBtn = document.querySelector('.solution-btn');
    if (solutionBtn) {
        solutionBtn.title = t('buttons.solution');
    }
    
    // Кнопка библиотеки
    const libraryBtn = document.querySelector('.library-btn');
    if (libraryBtn) {
        libraryBtn.title = t('buttons.library');
    }
    
    // Кнопка звука
    const soundBtn = document.querySelector('.sound-btn');
    if (soundBtn) {
        const isSoundOn = window.isSoundOn !== false;
        soundBtn.title = t(isSoundOn ? 'sound.on' : 'sound.off');
        // Обновляем иконку
        soundBtn.innerHTML = isSoundOn ? 
            '<img src="./images/UI/SoundOn.png" alt="Sound On" style="width: 48px; height: 48px;">' :
            '<img src="./images/UI/SoundOff.png" alt="Sound Off" style="width: 48px; height: 48px;">';
    }
};

// Обновление модальных окон
const updateModals = () => {
    // Обновляем открытые модальные окна
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        // Здесь можно добавить логику обновления конкретных модальных окон
        // Пока просто обновляем кнопки закрытия
        const closeBtn = modal.querySelector('button');
        if (closeBtn && !closeBtn.textContent.includes('OK')) {
            closeBtn.textContent = t('game.close');
        }
    });
};

// Инициализация локализации
export const initLocalization = async () => {
    // Загружаем сохраненную локаль или определяем по языку браузера
    const savedLocale = localStorage.getItem('locale');
    const browserLocale = navigator.language.startsWith('ru') ? 'ru' : 'en';
    const locale = savedLocale || browserLocale;
    
    // Ждем полной загрузки переводов
    await loadTranslations(locale);
};

// Экспортируем функцию для создания кнопки переключения языка
export const createLanguageToggle = () => {
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'language-toggle-btn';
    toggleBtn.textContent = currentLocale.toUpperCase();
    toggleBtn.style.cssText = `
        padding: 8px 12px;
        border: 2px solid #333;
        border-radius: 4px;
        background: white;
        color: black;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.3s ease;
        min-width: 40px;
        min-height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    toggleBtn.addEventListener('click', async () => {
        await toggleLocale();
        toggleBtn.textContent = currentLocale.toUpperCase();
    });
    
    return toggleBtn;
}; 
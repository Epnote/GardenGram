# 🎮 GardenGram - Nonograms Game Server

Python сервер для игры Nonograms (японские кроссворды) с поддержкой мультиплеера через WebSocket и мультиплатформенным SDK.

## 🚀 Быстрый запуск

### 1. Установка зависимостей
```bash
pip install -r requirements.txt
```

### 2. Запуск сервера
```bash
python server.py
```

Сервер будет доступен по адресу: **http://localhost:5000**

## 📁 Структура проекта

```
GardenGram/
├── server.py              # Основной сервер на Flask + SocketIO
├── requirements.txt       # Python зависимости
├── templates/            # HTML шаблоны (создается автоматически)
├── nonograms/           # Фронтенд игры
│   ├── index.html       # Главная страница
│   ├── js/             # JavaScript модули
│   │   ├── main.js     # Основной файл игры
│   │   └── modules/
│   │       └── serverConnection.js  # Подключение к серверу
│   └── css/            # Стили
└── Assets/             # Ресурсы игры
```

## 🔌 API Endpoints

### REST API
- `GET /` - Главная страница сервера
- `GET /api/puzzles` - Список доступных головоломок
- `GET /api/puzzle/<size>` - Данные конкретной головоломки
- `POST /api/games` - Создание новой игры
- `GET /api/games/<game_id>` - Информация об игре

### WebSocket Events
- `connect` - Подключение клиента
- `join_game` - Присоединение к игре
- `make_move` - Ход игрока
- `leave_game` - Выход из игры

## 🎯 Возможности

- ✅ Мультиплеер в реальном времени
- ✅ Синхронизация игрового поля
- ✅ Проверка решения головоломки
- ✅ Поддержка разных размеров (5x5, 10x10)
- ✅ WebSocket соединение
- ✅ REST API для управления играми
- ✅ Мультиплатформенный SDK (Яндекс.Игры, VK, OK, CrazyGames, Poki и др.)
- ✅ Аналитика и метрики
- ✅ Рекламные блоки
- ✅ Таблицы лидеров
- ✅ Сохранение прогресса
- ✅ Автоматическое определение платформы

## 🛠 Технологии

- **Backend**: Python, Flask, Flask-SocketIO
- **Frontend**: JavaScript, Socket.IO Client
- **SDK**: Мультиплатформенный LisSDK (Яндекс.Игры, VK, OK, CrazyGames, Poki)
- **Протокол**: WebSocket + REST API
- **Аналитика**: GameAnalytics, платформенные метрики

## 🔧 Настройка

### Изменение порта
Отредактируйте последнюю строку в `server.py`:
```python
socketio.run(app, host='0.0.0.0', port=5000, debug=True)
```

### Добавление новых головоломок
Добавьте в `SAMPLE_PUZZLES` в `server.py`:
```python
"15x15": {
    "rows": [...],
    "cols": [...],
    "solution": [...]
}
```

## 🎮 Подключение клиента

Клиент автоматически подключается к серверу и платформенному SDK через модуль `gameIntegration.js`. Для ручного подключения:

```javascript
import gameIntegration from './modules/gameIntegration.js';

// Инициализация
await gameIntegration.init('http://localhost:5000');

// Запуск игры
const game = await gameIntegration.startGame('5x5');

// Ход в игре
gameIntegration.makeMove(0, 0, 1);

// Показать рекламу
await gameIntegration.showRewardedAd();

// Показать таблицу лидеров
await gameIntegration.showLeaderboard();
```

### Платформенные возможности

```javascript
// Получить информацию о платформе
const features = gameIntegration.getPlatformFeatures();
console.log('Platform:', features.name);
console.log('Has ads:', features.hasAds);
console.log('Has leaderboard:', features.hasLeaderboard);

// Сохранение/загрузка данных
await gameIntegration.saveGameData(gameData);
const data = await gameIntegration.loadGameData();
```

## 🌐 Поддерживаемые платформы

- **Яндекс.Игры** - Полная поддержка (реклама, лидерборды, платежи)
- **VK Игры** - Полная поддержка (реклама, лидерборды, социальные функции)
- **OK Игры** - Полная поддержка (реклама, лидерборды)
- **CrazyGames** - Базовая поддержка (аналитика, реклама)
- **Poki** - Базовая поддержка (аналитика, реклама)
- **GameDistribution** - Базовая поддержка (аналитика, реклама)
- **PlayDeck** - Базовая поддержка (аналитика, реклама)

## 🎯 Аналитика и метрики

Игра автоматически отправляет метрики на поддерживаемые платформы:
- Время игры
- Завершенные головоломки
- Ошибки игрока
- Время решения
- Прогресс по уровням

## 🐛 Отладка

Сервер запускается в режиме отладки. Логи подключений и событий выводятся в консоль.

## 📝 Лицензия

MIT License 
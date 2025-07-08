// Модуль для работы с Яндекс.Игры SDK
let YaGames = null;
let isSDKReady = false;

// Глобальный обработчик ошибок для подавления ошибок postMessage в тестовом режиме
const originalConsoleError = console.error;
console.error = (...args) => {
    const message = args.join(' ');
    if (message.includes('No parent to post message') || 
        message.includes('postToParent') ||
        message.includes('postMessage') ||
        message.includes('v2:1')) {
        // Игнорируем ошибки связанные с postMessage в тестовом режиме
        return;
    }
    originalConsoleError.apply(console, args);
};

// Инициализация SDK
export const initYandexGames = () => {
    return new Promise((resolve, reject) => {
        // Проверяем, доступен ли SDK
        if (typeof window.YaGames !== 'undefined') {
            YaGames = window.YaGames;
            
            YaGames.init()
                .then((sdk) => {
                    console.log('Яндекс.Игры SDK инициализирован');
                    isSDKReady = true;
                    resolve(sdk);
                })
                .catch((error) => {
                    console.error('Ошибка инициализации Яндекс.Игры SDK:', error);
                    isSDKReady = false;
                    // В тестовом режиме не отклоняем промис, а разрешаем его
                    if (isTestMode()) {
                        console.log('Тестовый режим: продолжаем работу без SDK');
                        resolve(null);
                    } else {
                        reject(error);
                    }
                });
        } else {
            console.log('Яндекс.Игры SDK недоступен, используем локальный режим');
            isSDKReady = false;
            resolve(null);
        }
    });
};

// Показать рекламу
export const showRewardedAd = () => {
    return new Promise((resolve, reject) => {
        // Проверяем тестовый режим
        if (isTestMode()) {
            console.log('Тестовый режим: имитируем показ рекламы');
            // Имитация показа рекламы
            setTimeout(() => {
                resolve(true);
            }, 2000);
            return;
        }

        if (!isSDKReady || !YaGames) {
            console.log('SDK недоступен, показываем имитацию рекламы');
            // Имитация показа рекламы
            setTimeout(() => {
                resolve(true);
            }, 2000);
            return;
        }

        YaGames.adv.showRewardedVideo({
            callbacks: {
                onOpen: () => {
                    console.log('Реклама открыта');
                },
                onRewarded: () => {
                    console.log('Пользователь получил награду');
                    resolve(true);
                },
                onClose: () => {
                    console.log('Реклама закрыта');
                    resolve(false);
                },
                onError: (error) => {
                    console.error('Ошибка показа рекламы:', error);
                    // В тестовом режиме позволяем продолжить выполнение
                    if (error && (error.includes('test') || error.includes('development') || error.includes('unavailable'))) {
                        console.log('Тестовый режим: позволяем продолжить выполнение');
                        resolve(true);
                    } else {
                        reject(error);
                    }
                }
            }
        });
    });
};

// Показать межстраничную рекламу
export const showInterstitialAd = () => {
    return new Promise((resolve, reject) => {
        if (!isSDKReady || !YaGames) {
            console.log('SDK недоступен, показываем имитацию межстраничной рекламы');
            setTimeout(() => {
                resolve(true);
            }, 1000);
            return;
        }

        YaGames.adv.showFullscreenAdv({
            callbacks: {
                onOpen: () => {
                    console.log('Межстраничная реклама открыта');
                },
                onClose: (wasShown) => {
                    console.log('Межстраничная реклама закрыта, была показана:', wasShown);
                    resolve(wasShown);
                },
                onError: (error) => {
                    console.error('Ошибка показа межстраничной рекламы:', error);
                    reject(error);
                }
            }
        });
    });
};

// Получить данные игрока
export const getPlayerData = () => {
    return new Promise((resolve, reject) => {
        if (!isSDKReady || !YaGames) {
            console.log('SDK недоступен, возвращаем тестовые данные');
            resolve({
                name: 'Тестовый игрок',
                photo: null,
                uniqueID: 'test_player_123'
            });
            return;
        }

        YaGames.getPlayer()
            .then((player) => {
                resolve({
                    name: player.getName(),
                    photo: player.getPhoto(),
                    uniqueID: player.getUniqueID()
                });
            })
            .catch((error) => {
                console.error('Ошибка получения данных игрока:', error);
                reject(error);
            });
    });
};

// Сохранить данные
export const saveData = (data) => {
    return new Promise((resolve, reject) => {
        if (!isSDKReady || !YaGames) {
            console.log('SDK недоступен, сохраняем в localStorage');
            localStorage.setItem('yandex_games_data', JSON.stringify(data));
            resolve(true);
            return;
        }

        YaGames.getPlayer()
            .then((player) => {
                return player.setData(data);
            })
            .then(() => {
                console.log('Данные сохранены в Яндекс.Игры');
                resolve(true);
            })
            .catch((error) => {
                console.error('Ошибка сохранения данных:', error);
                reject(error);
            });
    });
};

// Загрузить данные
export const loadData = () => {
    return new Promise((resolve, reject) => {
        if (!isSDKReady || !YaGames) {
            console.log('SDK недоступен, загружаем из localStorage');
            const data = localStorage.getItem('yandex_games_data');
            resolve(data ? JSON.parse(data) : null);
            return;
        }

        YaGames.getPlayer()
            .then((player) => {
                return player.getData();
            })
            .then((data) => {
                console.log('Данные загружены из Яндекс.Игры');
                resolve(data);
            })
            .catch((error) => {
                console.error('Ошибка загрузки данных:', error);
                reject(error);
            });
    });
};

// Показать лидерборд
export const showLeaderboard = () => {
    return new Promise((resolve, reject) => {
        if (!isSDKReady || !YaGames) {
            console.log('SDK недоступен, лидерборд недоступен');
            resolve(false);
            return;
        }

        YaGames.getLeaderboards()
            .then((leaderboards) => {
                return leaderboards.open();
            })
            .then(() => {
                console.log('Лидерборд показан');
                resolve(true);
            })
            .catch((error) => {
                console.error('Ошибка показа лидерборда:', error);
                reject(error);
            });
    });
};

// Отправить счет в лидерборд
export const setLeaderboardScore = (leaderboardName, score) => {
    return new Promise((resolve, reject) => {
        if (!isSDKReady || !YaGames) {
            console.log('SDK недоступен, счет не отправлен');
            resolve(false);
            return;
        }

        YaGames.getLeaderboards()
            .then((leaderboards) => {
                return leaderboards.setScore(leaderboardName, score);
            })
            .then(() => {
                console.log('Счет отправлен в лидерборд');
                resolve(true);
            })
            .catch((error) => {
                console.error('Ошибка отправки счета:', error);
                reject(error);
            });
    });
};

// Проверить готовность SDK
export const isSDKAvailable = () => {
    return isSDKReady;
};

// Проверить, находимся ли мы в тестовом режиме
export const isTestMode = () => {
    // Проверяем различные признаки тестового режима
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.includes('192.168.');
    
    const isFileProtocol = window.location.protocol === 'file:';
    
    const isDevelopment = window.location.hostname.includes('dev') ||
                         window.location.hostname.includes('test') ||
                         window.location.hostname.includes('staging');
    
    return isLocalhost || isFileProtocol || isDevelopment || !isSDKReady;
}; 
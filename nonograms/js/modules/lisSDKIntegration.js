// Модуль для интеграции с LisSDK
let lisSDK = null;

// Инициализация LisSDK
export const initLisSDK = async () => {
    try {
        if (typeof LisSDK !== 'undefined') {
            lisSDK = await LisSDK.init();
            console.log('LisSDK initialized successfully', lisSDK);
            return true;
        } else {
            console.warn('LisSDK not available');
            return false;
        }
    } catch (error) {
        console.error('Failed to initialize LisSDK:', error);
        return false;
    }
};

// Показать рекламу за вознаграждение
export const showRewardedAd = () => {
    return new Promise((resolve, reject) => {
        if (!lisSDK || !lisSDK.adv || !lisSDK.adv.rewarded) {
            console.warn('Rewarded ads not available');
            reject(new Error('Rewarded ads not available'));
            return;
        }

        lisSDK.adv.rewarded.show({
            onOpen: () => {
                console.log('Rewarded ad opened');
            },
            onClose: (fulfilled) => {
                console.log('Rewarded ad closed, fulfilled:', fulfilled);
                if (fulfilled) {
                    resolve(true);
                } else {
                    reject(new Error('Ad not fulfilled'));
                }
            },
            onError: (error) => {
                console.error('Rewarded ad error:', error);
                reject(error);
            }
        });
    });
};

// Проверить доступность рекламы
export const isRewardedAdAvailable = () => {
    return lisSDK && lisSDK.adv && lisSDK.adv.rewarded;
}; 
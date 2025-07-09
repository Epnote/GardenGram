// Multiplatform SDK integration for Nonograms game
import { LisSDK } from '../sdk.js';

class PlatformSDK {
    constructor() {
        this.sdk = null;
        this.isInitialized = false;
        this.platformName = 'unknown';
        this.onReadyCallback = null;
        this.onGameStartCallback = null;
        this.onGameEndCallback = null;
    }

    // Initialize the SDK
    async init() {
        try {
            // Initialize LisSDK
            this.sdk = await LisSDK.init({
                gameId: 'garden-gram-nonograms',
                version: '1.0.0',
                debug: true
            });

            this.platformName = this.sdk.platform.name;
            this.isInitialized = true;

            console.log(`🎮 Platform SDK initialized: ${this.platformName}`);

            // Set up event listeners
            this.setupEventListeners();

            // Mark game as ready
            this.sdk.metrics.gameReady();

            if (this.onReadyCallback) {
                this.onReadyCallback(this.sdk);
            }

            return this.sdk;
        } catch (error) {
            console.error('Failed to initialize platform SDK:', error);
            return null;
        }
    }

    // Set up event listeners for SDK events
    setupEventListeners() {
        if (!this.sdk) return;

        // Listen for platform-specific events
        this.sdk.events.on('gameStart', () => {
            console.log('🎮 Game started via platform SDK');
            if (this.onGameStartCallback) {
                this.onGameStartCallback();
            }
        });

        this.sdk.events.on('gameEnd', () => {
            console.log('🎮 Game ended via platform SDK');
            if (this.onGameEndCallback) {
                this.onGameEndCallback();
            }
        });

        // Listen for ads events
        this.sdk.events.on('adStarted', () => {
            console.log('📺 Ad started');
        });

        this.sdk.events.on('adFinished', () => {
            console.log('📺 Ad finished');
        });

        this.sdk.events.on('adError', (error) => {
            console.error('📺 Ad error:', error);
        });
    }

    // Start the game
    gameStart() {
        if (this.sdk && this.isInitialized) {
            this.sdk.metrics.gameStart();
        }
    }

    // End the game
    gameEnd(score = 0, level = 1) {
        if (this.sdk && this.isInitialized) {
            this.sdk.metrics.gameEnd({
                score: score,
                level: level
            });
        }
    }

    // Track level completion
    levelComplete(level, score, time) {
        if (this.sdk && this.isInitialized) {
            this.sdk.metrics.levelComplete({
                level: level,
                score: score,
                time: time
            });
        }
    }

    // Track puzzle completion
    puzzleComplete(puzzleSize, time, mistakes) {
        if (this.sdk && this.isInitialized) {
            this.sdk.metrics.customEvent('puzzle_complete', {
                puzzle_size: puzzleSize,
                completion_time: time,
                mistakes: mistakes
            });
        }
    }

    // Show rewarded ad
    async showRewardedAd() {
        if (this.sdk && this.isInitialized && this.sdk.ads) {
            try {
                const result = await this.sdk.ads.showRewarded();
                return result;
            } catch (error) {
                console.error('Failed to show rewarded ad:', error);
                return false;
            }
        }
        return false;
    }

    // Show interstitial ad
    async showInterstitialAd() {
        if (this.sdk && this.isInitialized && this.sdk.ads) {
            try {
                await this.sdk.ads.showInterstitial();
                return true;
            } catch (error) {
                console.error('Failed to show interstitial ad:', error);
                return false;
            }
        }
        return false;
    }

    // Get platform-specific features
    getPlatformFeatures() {
        if (!this.sdk) return {};

        return {
            name: this.platformName,
            hasAds: !!this.sdk.ads,
            hasLeaderboard: !!this.sdk.leaderboard,
            hasPayments: !!this.sdk.payments,
            hasSocial: !!this.sdk.social,
            hasStorage: !!this.sdk.storage
        };
    }

    // Save game data
    async saveGameData(data) {
        if (this.sdk && this.isInitialized && this.sdk.storage) {
            try {
                await this.sdk.storage.set('gameData', data);
                return true;
            } catch (error) {
                console.error('Failed to save game data:', error);
                return false;
            }
        }
        return false;
    }

    // Load game data
    async loadGameData() {
        if (this.sdk && this.isInitialized && this.sdk.storage) {
            try {
                const data = await this.sdk.storage.get('gameData');
                return data || null;
            } catch (error) {
                console.error('Failed to load game data:', error);
                return null;
            }
        }
        return null;
    }

    // Submit score to leaderboard
    async submitScore(score, level = 1) {
        if (this.sdk && this.isInitialized && this.sdk.leaderboard) {
            try {
                await this.sdk.leaderboard.submitScore(score, level);
                return true;
            } catch (error) {
                console.error('Failed to submit score:', error);
                return false;
            }
        }
        return false;
    }

    // Show leaderboard
    async showLeaderboard() {
        if (this.sdk && this.isInitialized && this.sdk.leaderboard) {
            try {
                await this.sdk.leaderboard.show();
                return true;
            } catch (error) {
                console.error('Failed to show leaderboard:', error);
                return false;
            }
        }
        return false;
    }

    // Set callbacks
    onReady(callback) {
        this.onReadyCallback = callback;
    }

    onGameStart(callback) {
        this.onGameStartCallback = callback;
    }

    onGameEnd(callback) {
        this.onGameEndCallback = callback;
    }

    // Get SDK instance
    getSDK() {
        return this.sdk;
    }

    // Check if SDK is initialized
    isSDKReady() {
        return this.isInitialized && this.sdk !== null;
    }

    // Get platform name
    getPlatformName() {
        return this.platformName;
    }
}

// Export singleton instance
const platformSDK = new PlatformSDK();
export default platformSDK; 
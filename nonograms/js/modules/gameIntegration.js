// Game integration module - combines server connection and platform SDK
import ServerConnection from './serverConnection.js';
import platformSDK from './platformSDK.js';

class GameIntegration {
    constructor() {
        this.serverConnection = new ServerConnection();
        this.platformSDK = platformSDK;
        this.isInitialized = false;
        this.gameState = {
            currentPuzzle: null,
            score: 0,
            level: 1,
            startTime: null,
            mistakes: 0
        };
    }

    // Initialize both server and platform SDK
    async init(serverUrl = 'http://localhost:5000') {
        try {
            console.log('🎮 Initializing game integration...');

            // Initialize platform SDK first
            await this.platformSDK.init();
            
            // Initialize server connection
            this.serverConnection.init(serverUrl);

            // Set up event handlers
            this.setupEventHandlers();

            this.isInitialized = true;
            console.log('✅ Game integration initialized successfully');

            return true;
        } catch (error) {
            console.error('❌ Failed to initialize game integration:', error);
            return false;
        }
    }

    // Set up event handlers for both server and platform
    setupEventHandlers() {
        // Platform SDK events
        this.platformSDK.onReady((sdk) => {
            console.log('🎮 Platform SDK ready:', sdk.platform.name);
            this.loadGameData();
        });

        this.platformSDK.onGameStart(() => {
            console.log('🎮 Game started via platform');
            this.gameState.startTime = Date.now();
        });

        this.platformSDK.onGameEnd(() => {
            console.log('🎮 Game ended via platform');
            this.saveGameData();
        });

        // Server connection events
        this.serverConnection.onMove((data) => {
            console.log('🔄 Move received from server:', data);
            // Handle move from other players
        });

        this.serverConnection.onGameUpdate((data) => {
            console.log('🔄 Game update from server:', data);
            // Handle game state updates
        });

        this.serverConnection.onPuzzleSolved((data) => {
            console.log('🎉 Puzzle solved via server:', data);
            this.handlePuzzleComplete(data);
        });
    }

    // Start a new game
    async startGame(puzzleSize = '5x5') {
        if (!this.isInitialized) {
            throw new Error('Game integration not initialized');
        }

        try {
            // Get puzzle from server
            const puzzle = await this.serverConnection.getPuzzle(puzzleSize);
            if (!puzzle) {
                throw new Error('Failed to get puzzle from server');
            }

            // Create game on server
            const game = await this.serverConnection.createGame(puzzleSize);
            
            // Join the game
            this.serverConnection.joinGame(game.game_id, this.getPlayerName());

            // Update game state
            this.gameState.currentPuzzle = puzzle;
            this.gameState.score = 0;
            this.gameState.level = 1;
            this.gameState.startTime = Date.now();
            this.gameState.mistakes = 0;

            // Notify platform SDK
            this.platformSDK.gameStart();

            console.log('🎮 Game started:', game.game_id);
            return game;

        } catch (error) {
            console.error('Failed to start game:', error);
            throw error;
        }
    }

    // Make a move in the game
    makeMove(row, col, value) {
        if (!this.isInitialized) {
            throw new Error('Game integration not initialized');
        }

        // Send move to server
        this.serverConnection.makeMove(row, col, value);

        // Track mistakes for analytics
        if (value === 2) { // Marked as wrong
            this.gameState.mistakes++;
        }
    }

    // Handle puzzle completion
    handlePuzzleComplete(data) {
        const completionTime = Date.now() - this.gameState.startTime;
        const timeInSeconds = Math.floor(completionTime / 1000);

        // Calculate score based on time and mistakes
        const baseScore = 1000;
        const timeBonus = Math.max(0, 300 - timeInSeconds) * 10; // Bonus for fast completion
        const mistakePenalty = this.gameState.mistakes * 50;
        const finalScore = Math.max(0, baseScore + timeBonus - mistakePenalty);

        this.gameState.score = finalScore;

        // Track analytics
        this.platformSDK.puzzleComplete(
            this.gameState.currentPuzzle ? this.gameState.currentPuzzle.rows.length : 5,
            timeInSeconds,
            this.gameState.mistakes
        );

        this.platformSDK.levelComplete(
            this.gameState.level,
            finalScore,
            timeInSeconds
        );

        // Submit score to leaderboard
        this.platformSDK.submitScore(finalScore, this.gameState.level);

        // Save game data
        this.saveGameData();

        console.log(`🎉 Puzzle completed! Score: ${finalScore}, Time: ${timeInSeconds}s, Mistakes: ${this.gameState.mistakes}`);
    }

    // Save game data
    async saveGameData() {
        const gameData = {
            score: this.gameState.score,
            level: this.gameState.level,
            totalPlayTime: Date.now() - this.gameState.startTime,
            puzzlesCompleted: this.gameState.level,
            lastPlayed: new Date().toISOString()
        };

        // Save to platform storage
        await this.platformSDK.saveGameData(gameData);

        // Also save to local storage as backup
        localStorage.setItem('gardenGramData', JSON.stringify(gameData));
    }

    // Load game data
    async loadGameData() {
        try {
            // Try platform storage first
            let data = await this.platformSDK.loadGameData();
            
            // Fallback to local storage
            if (!data) {
                const localData = localStorage.getItem('gardenGramData');
                if (localData) {
                    data = JSON.parse(localData);
                }
            }

            if (data) {
                this.gameState.score = data.score || 0;
                this.gameState.level = data.level || 1;
                console.log('📊 Game data loaded:', data);
            }

            return data;
        } catch (error) {
            console.error('Failed to load game data:', error);
            return null;
        }
    }

    // Get player name from platform or generate one
    getPlayerName() {
        if (this.platformSDK.isSDKReady()) {
            const sdk = this.platformSDK.getSDK();
            if (sdk.player && sdk.player.name) {
                return sdk.player.name;
            }
        }
        return `Player_${Math.floor(Math.random() * 1000)}`;
    }

    // Show ads
    async showRewardedAd() {
        return await this.platformSDK.showRewardedAd();
    }

    async showInterstitialAd() {
        return await this.platformSDK.showInterstitialAd();
    }

    // Show leaderboard
    async showLeaderboard() {
        return await this.platformSDK.showLeaderboard();
    }

    // Get platform features
    getPlatformFeatures() {
        return this.platformSDK.getPlatformFeatures();
    }

    // Get connection status
    getConnectionStatus() {
        return {
            server: this.serverConnection.getConnectionStatus(),
            platform: {
                name: this.platformSDK.getPlatformName(),
                ready: this.platformSDK.isSDKReady()
            }
        };
    }

    // End game
    endGame() {
        this.platformSDK.gameEnd(this.gameState.score, this.gameState.level);
        this.serverConnection.leaveGame();
        this.saveGameData();
    }

    // Disconnect everything
    disconnect() {
        this.serverConnection.disconnect();
        this.isInitialized = false;
    }
}

// Export singleton instance
const gameIntegration = new GameIntegration();
export default gameIntegration; 
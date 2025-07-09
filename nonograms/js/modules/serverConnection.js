// Server connection module for Nonograms game
class ServerConnection {
    constructor() {
        this.socket = null;
        this.gameId = null;
        this.playerName = null;
        this.isConnected = false;
        this.onMoveCallback = null;
        this.onGameUpdateCallback = null;
        this.onPuzzleSolvedCallback = null;
    }

    // Initialize connection to the game server
    init(serverUrl = 'http://localhost:5000') {
        if (typeof io === 'undefined') {
            console.error('Socket.IO not loaded. Make sure to include socket.io.js');
            return false;
        }

        this.socket = io(serverUrl);
        
        this.socket.on('connect', () => {
            console.log('Connected to game server');
            this.isConnected = true;
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from game server');
            this.isConnected = false;
        });

        this.socket.on('joined_game', (data) => {
            console.log('Joined game:', data);
            this.gameId = data.game.id;
            this.playerName = data.player.name;
        });

        this.socket.on('player_joined', (data) => {
            console.log('Player joined:', data);
            if (this.onGameUpdateCallback) {
                this.onGameUpdateCallback(data);
            }
        });

        this.socket.on('move_made', (data) => {
            console.log('Move made:', data);
            if (this.onMoveCallback) {
                this.onMoveCallback(data);
            }
        });

        this.socket.on('puzzle_solved', (data) => {
            console.log('Puzzle solved!', data);
            if (this.onPuzzleSolvedCallback) {
                this.onPuzzleSolvedCallback(data);
            }
        });

        this.socket.on('error', (data) => {
            console.error('Server error:', data);
        });

        return true;
    }

    // Create a new game
    async createGame(puzzleSize = '5x5') {
        if (!this.isConnected) {
            throw new Error('Not connected to server');
        }

        try {
            const response = await fetch('/api/games', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ puzzle_size: puzzleSize })
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Failed to create game:', error);
            throw error;
        }
    }

    // Join an existing game
    joinGame(gameId, playerName = null) {
        if (!this.isConnected) {
            throw new Error('Not connected to server');
        }

        this.playerName = playerName || `Player_${Math.floor(Math.random() * 1000)}`;
        
        this.socket.emit('join_game', {
            game_id: gameId,
            player_name: this.playerName
        });
    }

    // Make a move in the game
    makeMove(row, col, value) {
        if (!this.isConnected || !this.gameId) {
            throw new Error('Not in a game');
        }

        this.socket.emit('make_move', {
            game_id: this.gameId,
            row: row,
            col: col,
            value: value
        });
    }

    // Leave the current game
    leaveGame() {
        if (this.gameId) {
            this.socket.emit('leave_game', { game_id: this.gameId });
            this.gameId = null;
        }
    }

    // Get available puzzles from server
    async getPuzzles() {
        try {
            const response = await fetch('/api/puzzles');
            return await response.json();
        } catch (error) {
            console.error('Failed to get puzzles:', error);
            return [];
        }
    }

    // Get specific puzzle data
    async getPuzzle(size) {
        try {
            const response = await fetch(`/api/puzzle/${size}`);
            return await response.json();
        } catch (error) {
            console.error('Failed to get puzzle:', error);
            return null;
        }
    }

    // Set callback for when a move is made
    onMove(callback) {
        this.onMoveCallback = callback;
    }

    // Set callback for game updates
    onGameUpdate(callback) {
        this.onGameUpdateCallback = callback;
    }

    // Set callback for puzzle solved
    onPuzzleSolved(callback) {
        this.onPuzzleSolvedCallback = callback;
    }

    // Disconnect from server
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
            this.gameId = null;
        }
    }

    // Get connection status
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            gameId: this.gameId,
            playerName: this.playerName
        };
    }
}

// Export for use in other modules
export default ServerConnection; 
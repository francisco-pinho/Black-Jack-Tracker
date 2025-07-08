
class BlackjackTracker {
    constructor() {
        this.players = [];
        this.winValue = 0.05;
        this.gameActive = false;
        this.playerIdCounter = 0;

        this.initializeElements();
        this.bindEvents();
        this.loadFromStorage();

        this.initSaveWorker();
        this.pendingSave = false;
    }

    initSaveWorker() {
        // Web Workers aren't ideal for localStorage, so we'll use async approach instead
        this.saveQueue = [];
        this.isSaving = false;
    }


    initializeElements() {
        // Screen elements
        this.setupScreen = document.getElementById('setupScreen');
        this.gameScreen = document.getElementById('gameScreen');

        // Setup elements
        this.winValueInput = document.getElementById('winValue');
        this.newPlayerNameInput = document.getElementById('newPlayerName');
        this.addPlayerSetupBtn = document.getElementById('addPlayerSetupBtn');
        this.setupPlayersList = document.getElementById('setupPlayersList');
        this.startGameBtn = document.getElementById('startGameBtn');

        // Game elements
        this.newPlayerGameInput = document.getElementById('newPlayerGameName');
        this.addPlayerGameBtn = document.getElementById('addPlayerGameBtn');
        this.playersGrid = document.getElementById('playersGrid');
        this.currentWinValueSpan = document.getElementById('currentWinValue');
        this.totalPlayersSpan = document.getElementById('totalPlayers');
        this.totalEarningsSpan = document.getElementById('totalEarnings');

        // Header buttons
        this.newGameBtn = document.getElementById('newGameBtn');
        this.resetGameBtn = document.getElementById('resetGameBtn');

        // Templates
        this.playerCardTemplate = document.getElementById('playerCardTemplate');
        this.setupPlayerTemplate = document.getElementById('setupPlayerTemplate');
    }

    bindEvents() {
        // Setup events
        this.addPlayerSetupBtn.addEventListener('click', () => this.addPlayerToSetup());
        this.newPlayerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addPlayerToSetup();
        });
        this.startGameBtn.addEventListener('click', () => this.startGame());
        this.winValueInput.addEventListener('input', () => this.updateStartButton());

        // Game events
        this.addPlayerGameBtn.addEventListener('click', () => this.addPlayerToGame());
        this.newPlayerGameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addPlayerToGame();
        });

        // Header events
        this.newGameBtn.addEventListener('click', () => this.newGame());
        this.resetGameBtn.addEventListener('click', () => this.resetGame());
    }

    addPlayerToSetup() {
        const name = this.newPlayerNameInput.value.trim();
        if (!name) {
            this.showMessage('Please enter a player name', 'error');
            return;
        }

        if (this.players.find(p => p.name.toLowerCase() === name.toLowerCase())) {
            this.showMessage('Player with this name already exists', 'error');
            return;
        }

        const player = {
            id: this.playerIdCounter++,
            name: name,
            wins: 0,
            losses: 0,
            blackjacks: 0,
            netScore: 0,
            earnings: 0
        };

        this.players.push(player);
        this.newPlayerNameInput.value = '';
        this.renderSetupPlayers();
        this.updateStartButton();
        this.saveToStorage();
    }

    renderSetupPlayers() {
        this.setupPlayersList.innerHTML = '';

        this.players.forEach(player => {
            const playerElement = this.setupPlayerTemplate.content.cloneNode(true);
            playerElement.querySelector('.player-name').textContent = player.name;

            const removeBtn = playerElement.querySelector('.remove-setup-player-btn');
            removeBtn.addEventListener('click', () => this.removePlayerFromSetup(player.id));

            this.setupPlayersList.appendChild(playerElement);
        });
    }

    removePlayerFromSetup(playerId) {
        this.players = this.players.filter(p => p.id !== playerId);
        this.renderSetupPlayers();
        this.updateStartButton();
        this.saveToStorage();
    }

    updateStartButton() {
        const hasPlayers = this.players.length > 0;
        const hasValidWinValue = parseFloat(this.winValueInput.value) >= 0;
        this.startGameBtn.disabled = !(hasPlayers && hasValidWinValue);
    }

    startGame() {
        this.winValue = parseFloat(this.winValueInput.value) || 0.05;
        this.gameActive = true;

        // Update game info
        this.currentWinValueSpan.textContent = `€${this.winValue.toFixed(2)}`;

        // Show game screen
        this.setupScreen.style.display = 'none';
        this.gameScreen.style.display = 'block';
        this.newGameBtn.style.display = 'inline-flex';
        this.resetGameBtn.style.display = 'inline-flex';

        this.renderPlayers();
        this.updateGameInfo();
        this.saveToStorage();
    }

    addPlayerToGame() {
        const name = this.newPlayerGameInput.value.trim();
        if (!name) {
            this.showMessage('Please enter a player name', 'error');
            return;
        }

        if (this.players.find(p => p.name.toLowerCase() === name.toLowerCase())) {
            this.showMessage('Player with this name already exists', 'error');
            return;
        }

        const player = {
            id: this.playerIdCounter++,
            name: name,
            wins: 0,
            losses: 0,
            blackjacks: 0,
            netScore: 0,
            earnings: 0
        };

        this.players.push(player);
        this.newPlayerGameInput.value = '';
        this.renderPlayers();
        this.updateGameInfo();
        this.saveToStorage();
    }

    renderPlayers() {
        this.playersGrid.innerHTML = '';

        this.players.forEach(player => {
            const playerCard = this.createPlayerCard(player);
            this.playersGrid.appendChild(playerCard);
        });
    }

    createPlayerCard(player) {
        const cardElement = this.playerCardTemplate.content.cloneNode(true);
        const card = cardElement.querySelector('.player-card');

        card.dataset.playerId = player.id;
        card.querySelector('.player-name').textContent = player.name;

        // Update stats
        this.updatePlayerCardStats(card, player);

        // Bind action buttons
        const actionButtons = card.querySelectorAll('.action-btn');
        actionButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.handlePlayerAction(player.id, btn.dataset.action);
            });
        });

        // Bind remove button
        const removeBtn = card.querySelector('.remove-player-btn');
        removeBtn.addEventListener('click', () => this.removePlayer(player.id));

        return cardElement;
    }

    updatePlayerCardStats(card, player) {
        card.querySelector('.wins').textContent = player.wins;
        card.querySelector('.losses').textContent = player.losses;
        card.querySelector('.blackjacks').textContent = player.blackjacks;
        card.querySelector('.net-score').textContent = player.netScore.toFixed(1);

        const earningsElement = card.querySelector('.earnings');
        earningsElement.textContent = `€${player.earnings.toFixed(2)}`;

        // Update earnings color
        earningsElement.classList.remove('positive', 'negative', 'zero');
        if (player.earnings > 0) {
            earningsElement.classList.add('positive');
        } else if (player.earnings < 0) {
            earningsElement.classList.add('negative');
        } else {
            earningsElement.classList.add('zero');
        }
    }

    handlePlayerAction(playerId, action) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) return;

        switch (action) {
            case 'win':
                player.wins++;
                player.netScore += 1;
                break;
            case 'loss':
                player.losses++;
                player.netScore -= 1;
                break;
            case 'doubleWin':
                player.wins += 2;
                player.netScore += 2;
                break;
            case 'doubleLoss':
                player.losses += 2;
                player.netScore -= 2;
                break;
            case 'blackjack':
                player.blackjacks++;
                player.netScore += 1.5;
                break;
        }

        // Calculate earnings
        player.earnings = player.netScore * this.winValue;

        // Update UI
        const playerCard = document.querySelector(`[data-player-id="${playerId}"]`);
        this.updatePlayerCardStats(playerCard, player);
        this.updateGameInfo();
        this.saveToStorage();

        // Show action feedback
        this.showActionFeedback(player.name, action);
    }

    showActionFeedback(playerName, action) {
        const messages = {
            win: `${playerName}: +1 Win`,
            loss: `${playerName}: +1 Loss`,
            doubleWin: `${playerName}: +2 Wins`,
            doubleLoss: `${playerName}: +2 Losses`,
            blackjack: `${playerName}: Blackjack! (+1.5)`
        };

        this.showMessage(messages[action], 'success');
    }

    removePlayer(playerId) {
        if (this.players.length <= 1) {
            this.showMessage('Cannot remove the last player', 'error');
            return;
        }

        const player = this.players.find(p => p.id === playerId);
        if (!player) return;

        if (confirm(`Remove ${player.name} from the game?`)) {
            this.players = this.players.filter(p => p.id !== playerId);
            this.renderPlayers();
            this.updateGameInfo();
            this.saveToStorage();
            this.showMessage(`${player.name} removed from game`, 'info');
        }
    }

    updateGameInfo() {
        this.totalPlayersSpan.textContent = this.players.length;

        const totalEarnings = this.players.reduce((sum, player) => sum + player.earnings, 0);
        this.totalEarningsSpan.textContent = `€${totalEarnings.toFixed(2)}`;

        // Update total earnings color
        this.totalEarningsSpan.classList.remove('positive', 'negative', 'zero');
        if (totalEarnings > 0) {
            this.totalEarningsSpan.classList.add('positive');
        } else if (totalEarnings < 0) {
            this.totalEarningsSpan.classList.add('negative');
        } else {
            this.totalEarningsSpan.classList.add('zero');
        }
    }

    resetGame() {

        this.players.forEach(player => {
            player.wins = 0;
            player.losses = 0;
            player.blackjacks = 0;
            player.netScore = 0;
            player.earnings = 0;
        });

        this.renderPlayers();
        this.updateGameInfo();
        this.saveToStorage();
        this.showMessage('Game scores reset', 'info');
    }

    newGame() {
        this.gameActive = false;
        this.players = [];
        this.winValue = 0.05;
        this.winValueInput.value = '0.05';
        this.newPlayerNameInput.value = '';
        this.newPlayerGameInput.value = '';

        // Show setup screen
        this.setupScreen.style.display = 'block';
        this.gameScreen.style.display = 'none';
        this.newGameBtn.style.display = 'none';
        this.resetGameBtn.style.display = 'none';

        this.renderSetupPlayers();
        this.updateStartButton();
        this.saveToStorage();
        this.showMessage('Ready for new game setup', 'info');
    }

    showMessage(message, type = 'info') {
        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.textContent = message;

        // Style the message
        Object.assign(messageEl.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '600',
            zIndex: '1000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            maxWidth: '300px',
            wordWrap: 'break-word'
        });

        // Set background color based on type
        const colors = {
            success: '#27ae60',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db'
        };
        messageEl.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(messageEl);

        // Animate in
        setTimeout(() => {
            messageEl.style.transform = 'translateX(0)';
        }, 10);

        // Animate out and remove
        setTimeout(() => {
            messageEl.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, 3000);
    }

    async saveToStorage() {
        if (this.isSaving) {
            this.pendingSave = true;
            return;
        }

        this.isSaving = true;
        
        await new Promise(resolve => {
            requestIdleCallback(() => {
                const gameState = {
                    players: this.players,
                    winValue: this.winValue,
                    gameActive: this.gameActive,
                    playerIdCounter: this.playerIdCounter
                };
                
                localStorage.setItem('blackjackTracker', JSON.stringify(gameState));
                this.isSaving = false;
                
                // Check if another save is pending
                if (this.pendingSave) {
                    this.pendingSave = false;
                    this.saveToStorage();
                }
                
                resolve();
            });
        });
    }

    loadFromStorage() {
        try {
            const saved = localStorage.getItem('blackjackTracker');
            if (saved) {
                const gameState = JSON.parse(saved);
                this.players = gameState.players || [];
                this.winValue = gameState.winValue || 0.05;
                this.gameActive = gameState.gameActive || false;
                this.playerIdCounter = gameState.playerIdCounter || 0;

                // Update UI based on loaded state
                this.winValueInput.value = this.winValue.toFixed(2);

                if (this.gameActive && this.players.length > 0) {
                    this.startGame();
                } else {
                    this.renderSetupPlayers();
                    this.updateStartButton();
                }
            }
        } catch (error) {
            console.error('Error loading from storage:', error);
            this.showMessage('Error loading saved game', 'error');
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const tracker = new BlackjackTracker();

    // Make it globally accessible for debugging
    window.blackjackTracker = tracker;

    console.log('Blackjack Score Tracker initialized successfully!');
});

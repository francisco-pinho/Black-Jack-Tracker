class BlackjackTracker {
    constructor() {
        this.players = [];
        this.winValue = 0.05;
        this.gameActive = false;
        this.playerIdCounter = 0;

        // Round tracking for visual feedback
        this.currentRoundPlayers = new Set(); // Track players who received a score this round

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
        this.currentWinValueSpan.textContent = `￦${this.winValue.toFixed(2)}`;

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
        earningsElement.textContent = `￦${player.earnings.toFixed(2)}`;

        // Update earnings color
        earningsElement.classList.remove('positive', 'negative', 'zero');
        if (player.earnings > 0) {
            earningsElement.classList.add('positive');
        } else if (player.earnings < 0) {
            earningsElement.classList.add('negative');
        } else {
            earningsElement.classList.add('zero');
        }

        // Update round status colors
        this.updatePlayerRoundStatus(card, player.id);
    }

    updatePlayerRoundStatus(card, playerId) {
        // Remove all round status classes
        card.classList.remove('round-win', 'round-loss', 'round-tie', 'round-pending', 'round-classified', 'round-blackjack', 'blackjack-celebration');

        if (!this.currentRoundPlayers.has(playerId)) {
            // Player hasn't received a classification this round
            card.classList.add('round-pending');
        } else {
            // Player has been classified - the specific color is set by setPlayerRoundStatus
            // We don't need to do anything here as the status is already set
        }
    }

    handlePlayerAction(playerId, action) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) return;

        // Track that this player received a score this round
        this.currentRoundPlayers.add(playerId);

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
            case 'tie':
                // Tie doesn't change any scores, but marks player as having received a classification
                break;
        }

        // Calculate earnings (only if not a tie that doesn't affect scores)
        if (action !== 'tie') {
            player.earnings = player.netScore * this.winValue;
        }

        // Update UI
        const playerCard = document.querySelector(`[data-player-id="${playerId}"]`);
        this.updatePlayerCardStats(playerCard, player);
        this.setPlayerRoundStatus(playerId, action);
        this.updateGameInfo();
        this.saveToStorage();

        // Show action feedback
        this.showActionFeedback(player.name, action);

        // Check if all players have been classified this round
        this.checkRoundComplete();
    }

    setPlayerRoundStatus(playerId, status) {
        const playerCard = document.querySelector(`[data-player-id="${playerId}"]`);
        if (!playerCard) return;

        // Remove ALL round status classes including blackjack-celebration
        playerCard.classList.remove('round-win', 'round-loss', 'round-tie', 'round-pending', 'round-classified', 'round-blackjack', 'blackjack-celebration');

        // Add the appropriate status class
        switch (status) {
            case 'win':
            case 'doubleWin':
                playerCard.classList.add('round-win');
                break;
            case 'blackjack':
                playerCard.classList.add('round-blackjack'); // Special class for blackjack
                this.triggerBlackjackCelebration(playerCard);
                break;
            case 'loss':
            case 'doubleLoss':
                playerCard.classList.add('round-loss');
                break;
            case 'tie':
                playerCard.classList.add('round-tie');
                break;
        }
    }

    showActionFeedback(playerName, action) {
        const messages = {
            win: `${playerName}: +1 Win`,
            loss: `${playerName}: +1 Loss`,
            doubleWin: `${playerName}: +2 Wins`,
            doubleLoss: `${playerName}: +2 Losses`,
            blackjack: `${playerName}: Blackjack! (+1.5)`,
            tie: `${playerName}: Tie (no change)`
        };

        this.showMessage(messages[action], 'success');
    }

    checkRoundComplete() {
        // Check if all players have received a classification this round
        if (this.currentRoundPlayers.size === this.players.length) {
            // All players classified, reset for next round
            setTimeout(() => {
                this.resetRoundStatus();
            }, 2000); // Wait 2 seconds before resetting
        }
    }

    resetRoundStatus() {
        // Clear the round tracking
        this.currentRoundPlayers.clear();

        // Remove ALL round status classes from all player cards
        const playerCards = document.querySelectorAll('.player-card');
        playerCards.forEach(card => {
            card.classList.remove('round-win', 'round-loss', 'round-tie', 'round-classified', 'round-pending', 'round-blackjack', 'blackjack-celebration');
        });

        this.showMessage('Nova rodada iniciada', 'info');
    }

    removePlayer(playerId) {
        if (this.players.length <= 1) {
            this.newGame();
            return;
        }

        const player = this.players.find(p => p.id === playerId);
        if (!player) return;


        this.players = this.players.filter(p => p.id !== playerId);
        this.renderPlayers();
        this.updateGameInfo();
        this.saveToStorage();
        this.showMessage(`${player.name} removed from game`, 'info');

    }

    updateGameInfo() {
        this.totalPlayersSpan.textContent = this.players.length;

        const totalEarnings = this.players.reduce((sum, player) => sum + player.earnings, 0);
        this.totalEarningsSpan.textContent = `￦${totalEarnings.toFixed(2)}`;

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

    triggerBlackjackCelebration(playerCard) {
        // Add the blackjack celebration class
        playerCard.classList.add('blackjack-celebration');

        // Create sparks container
        const sparksContainer = document.createElement('div');
        sparksContainer.className = 'rocket-sparks';

        // Create individual sparks
        const sparkEmojis = ['⭐', '✨', '💫', '🌟'];
        for (let i = 0; i < 6; i++) {
            const spark = document.createElement('div');
            spark.className = 'spark';
            spark.textContent = sparkEmojis[Math.floor(Math.random() * sparkEmojis.length)];

            // Random positioning
            spark.style.top = Math.random() * 80 + '%';
            spark.style.left = Math.random() * 80 + '%';
            spark.style.animationDelay = (Math.random() * 1.5) + 's';

            sparksContainer.appendChild(spark);
        }

        playerCard.appendChild(sparksContainer);

        // Remove only the sparks after animation completes, keep the yellow background
        setTimeout(() => {
            if (sparksContainer.parentNode) {
                sparksContainer.parentNode.removeChild(sparksContainer);
            }
        }, 2000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const tracker = new BlackjackTracker();

    // Make it globally accessible for debugging
    window.blackjackTracker = tracker;

    console.log('Blackjack Score Tracker initialized successfully!');
});

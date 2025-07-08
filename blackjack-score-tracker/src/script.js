class BlackjackTracker {
    constructor() {
        this.players = [];
        this.winValue = 0.05;
        this.gameActive = false;
        this.playerIdCounter = 0;
        this.gameStartTime = null;

        // Round tracking for visual feedback
        this.currentRoundPlayers = new Set(); // Track players who received a score this round
        this.currentRoundScores = new Map(); // Track the last score given to each player this round

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
        this.scoreboardScreen = document.getElementById('scoreboardScreen');

        // Setup elements
        this.winValueInput = document.getElementById('winValue');
        this.newPlayerNameInput = document.getElementById('newPlayerName');
        this.addPlayerSetupBtn = document.getElementById('addPlayerSetupBtn');
        this.setupPlayersList = document.getElementById('setupPlayersList');
        this.startGameBtn = document.getElementById('startGameBtn');

        // Game elements
        this.playersGrid = document.getElementById('playersGrid');
        this.currentWinValueSpan = document.getElementById('currentWinValue');
        this.totalPlayersSpan = document.getElementById('totalPlayers');
        this.totalEarningsSpan = document.getElementById('totalEarnings');

        // Header buttons
        this.addPlayerHeaderBtn = document.getElementById('addPlayerHeaderBtn');
        this.newGameBtn = document.getElementById('newGameBtn');
        this.resetGameBtn = document.getElementById('resetGameBtn');
        this.finishGameBtn = document.getElementById('finishGameBtn');

        // Modal elements
        this.addPlayerModal = document.getElementById('addPlayerModal');
        this.newPlayerModalName = document.getElementById('newPlayerModalName');
        this.closeModalBtn = document.getElementById('closeModalBtn');
        this.cancelAddPlayerBtn = document.getElementById('cancelAddPlayerBtn');
        this.confirmAddPlayerBtn = document.getElementById('confirmAddPlayerBtn');

        // Scoreboard elements
        this.gameDurationSpan = document.getElementById('gameDuration');
        this.finalTotalPlayersSpan = document.getElementById('finalTotalPlayers');
        this.finalTotalEarningsSpan = document.getElementById('finalTotalEarnings');
        this.scoreboardList = document.getElementById('scoreboardList');
        this.backToGameBtn = document.getElementById('backToGameBtn');
        this.startNewGameBtn = document.getElementById('startNewGameBtn');

        // Templates
        this.playerCardTemplate = document.getElementById('playerCardTemplate');
        this.setupPlayerTemplate = document.getElementById('setupPlayerTemplate');
        this.scoreboardItemTemplate = document.getElementById('scoreboardItemTemplate');
    }

    bindEvents() {
        // Setup events
        this.addPlayerSetupBtn.addEventListener('click', () => this.addPlayerToSetup());
        this.newPlayerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addPlayerToSetup();
        });
        this.startGameBtn.addEventListener('click', () => this.startGame());
        this.winValueInput.addEventListener('input', () => this.updateStartButton());

        // Game events (removed old add player input)

        // Header events
        this.addPlayerHeaderBtn.addEventListener('click', () => this.showAddPlayerModal());
        this.newGameBtn.addEventListener('click', () => this.newGame());
        this.resetGameBtn.addEventListener('click', () => this.resetGame());
        this.finishGameBtn.addEventListener('click', () => this.finishGame());

        // Modal events
        this.closeModalBtn.addEventListener('click', () => this.hideAddPlayerModal());
        this.cancelAddPlayerBtn.addEventListener('click', () => this.hideAddPlayerModal());
        this.confirmAddPlayerBtn.addEventListener('click', () => this.addPlayerFromModal());
        this.newPlayerModalName.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addPlayerFromModal();
            if (e.key === 'Escape') this.hideAddPlayerModal();
        });

        // Close modal when clicking outside
        this.addPlayerModal.addEventListener('click', (e) => {
            if (e.target === this.addPlayerModal) {
                this.hideAddPlayerModal();
            }
        });

        // Scoreboard events
        this.backToGameBtn.addEventListener('click', () => this.backToGame());
        this.startNewGameBtn.addEventListener('click', () => this.newGame());
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
        this.gameStartTime = new Date();

        // Update game info
        this.currentWinValueSpan.textContent = `💎${this.winValue.toFixed(2)}`;

        // Show game screen
        this.setupScreen.style.display = 'none';
        this.gameScreen.style.display = 'block';
        this.scoreboardScreen.style.display = 'none';
        this.addPlayerHeaderBtn.style.display = 'inline-flex';
        this.newGameBtn.style.display = 'inline-flex';
        this.resetGameBtn.style.display = 'inline-flex';
        this.finishGameBtn.style.display = 'inline-flex';

        this.renderPlayers();
        this.updateGameInfo();
        this.saveToStorage();
    }

    renderPlayers() {
        // Performance optimization: Use DocumentFragment for batch DOM updates
        const fragment = document.createDocumentFragment();

        this.players.forEach(player => {
            const playerCard = this.createPlayerCard(player);
            fragment.appendChild(playerCard);
        });

        // Clear and update in one operation
        this.playersGrid.innerHTML = '';
        this.playersGrid.appendChild(fragment);
    }

    createPlayerCard(player) {
        const cardElement = this.playerCardTemplate.content.cloneNode(true);
        const card = cardElement.querySelector('.player-card');

        card.dataset.playerId = player.id;
        card.querySelector('.player-name').textContent = player.name;

        // Update stats
        this.updatePlayerCardStats(card, player);

        // Bind action buttons with event delegation optimization
        const actionButtons = card.querySelectorAll('.action-btn');
        actionButtons.forEach(btn => {
            // Store the handler to avoid creating new functions on each render
            btn.onclick = (e) => {
                e.stopPropagation(); // Prevent event bubbling
                this.handlePlayerAction(player.id, btn.dataset.action);
            };
        });

        // Bind remove button with optimized event handling
        const removeBtn = card.querySelector('.remove-player-btn');
        removeBtn.onclick = (e) => {
            e.stopPropagation(); // Prevent event bubbling
            this.removePlayer(player.id);
        };

        // Bind edit button with optimized event handling
        const editBtn = card.querySelector('.edit-player-btn');
        editBtn.onclick = (e) => {
            e.stopPropagation(); // Prevent event bubbling
            this.editPlayerName(player.id);
        };

        return cardElement;
    }

    updatePlayerCardStats(card, player) {
        card.querySelector('.wins').textContent = player.wins;
        card.querySelector('.losses').textContent = player.losses;
        card.querySelector('.blackjacks').textContent = player.blackjacks;
        card.querySelector('.net-score').textContent = player.netScore.toFixed(1);

        const earningsElement = card.querySelector('.earnings');
        earningsElement.textContent = `💎${player.earnings.toFixed(2)}`;

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
        // Optimized class manipulation - batch all changes
        const classesToRemove = ['round-win', 'round-loss', 'round-tie', 'round-pending', 'round-classified', 'round-blackjack', 'blackjack-celebration'];

        // Use single call to remove all classes
        card.classList.remove(...classesToRemove);

        if (!this.currentRoundPlayers.has(playerId)) {
            // Player hasn't received a classification this round
            card.classList.add('round-pending');
        }
        // Specific color is set by setPlayerRoundStatus when needed
    }

    handlePlayerAction(playerId, action) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) return;

        // Check if player already has a score this round - if so, revert the previous one
        if (this.currentRoundScores.has(playerId)) {
            const previousAction = this.currentRoundScores.get(playerId);
            this.revertPlayerAction(player, previousAction);
            this.showActionFeedback(player.name, `Substituindo ${this.getActionName(previousAction)} por ${this.getActionName(action)}`, 'warning');
        } else {
            // Show normal action feedback for first score
            this.showActionFeedback(player.name, action);
        }

        // Track that this player received a score this round
        this.currentRoundPlayers.add(playerId);
        this.currentRoundScores.set(playerId, action);

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

        // Check if all players have been classified this round
        this.checkRoundComplete();
    }

    setPlayerRoundStatus(playerId, status) {
        const playerCard = document.querySelector(`[data-player-id="${playerId}"]`);
        if (!playerCard) return;

        // Optimized class manipulation - batch all changes
        const classesToRemove = ['round-win', 'round-loss', 'round-tie', 'round-pending', 'round-classified', 'round-blackjack', 'blackjack-celebration'];

        // Remove all status classes at once
        playerCard.classList.remove(...classesToRemove);

        // Add the appropriate status class
        switch (status) {
            case 'win':
            case 'doubleWin':
                playerCard.classList.add('round-win');
                break;
            case 'blackjack':
                playerCard.classList.add('round-blackjack');
                // Use requestAnimationFrame for smooth animation
                requestAnimationFrame(() => {
                    this.triggerBlackjackCelebration(playerCard);
                });
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

    showActionFeedback(playerName, action, type = 'success') {
        // Handle custom messages (like substitution messages)
        if (typeof action === 'string' && !['win', 'loss', 'doubleWin', 'doubleLoss', 'blackjack', 'tie'].includes(action)) {
            this.showMessage(action, type);
            return;
        }

        const messages = {
            win: `${playerName}: +1 Win`,
            loss: `${playerName}: +1 Loss`,
            doubleWin: `${playerName}: +2 Wins`,
            doubleLoss: `${playerName}: +2 Losses`,
            blackjack: `${playerName}: Blackjack! (+1.5)`,
            tie: `${playerName}: Tie (no change)`
        };

        this.showMessage(messages[action], type);
    }

    checkRoundComplete() {
        // Check if all players have received a classification this round
        if (this.currentRoundPlayers.size === this.players.length) {
            // All players classified, reset for next round
            setTimeout(() => {
                this.resetRoundStatus();
            }, 2000); // Wait 2 seconds before resetting
        }
    } resetRoundStatus() {
        // Clear the round tracking
        this.currentRoundPlayers.clear();
        this.currentRoundScores.clear(); // Clear the scores map too

        // Optimized class removal - batch all changes
        const playerCards = document.querySelectorAll('.player-card');
        const classesToRemove = ['round-win', 'round-loss', 'round-tie', 'round-classified', 'round-pending', 'round-blackjack', 'blackjack-celebration'];

        // Use requestAnimationFrame for smooth visual updates
        requestAnimationFrame(() => {
            playerCards.forEach(card => {
                card.classList.remove(...classesToRemove);
            });
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
        this.totalEarningsSpan.textContent = `💎${totalEarnings.toFixed(2)}`;

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
        this.gameStartTime = null;
        this.winValueInput.value = '0.05';
        this.newPlayerNameInput.value = '';

        // Show setup screen
        this.setupScreen.style.display = 'block';
        this.gameScreen.style.display = 'none';
        this.scoreboardScreen.style.display = 'none';
        this.addPlayerHeaderBtn.style.display = 'none';
        this.newGameBtn.style.display = 'none';
        this.resetGameBtn.style.display = 'none';
        this.finishGameBtn.style.display = 'none';

        this.renderSetupPlayers();
        this.updateStartButton();
        this.saveToStorage();
        this.showMessage('Ready for new game setup', 'info');
    }

    finishGame() {
        if (this.players.length === 0) {
            this.showMessage('No players to show results for', 'error');
            return;
        }

        this.showScoreboard();
    }

    backToGame() {
        this.setupScreen.style.display = 'none';
        this.gameScreen.style.display = 'block';
        this.scoreboardScreen.style.display = 'none';
    }

    showScoreboard() {
        // Calculate game duration
        const gameDuration = this.calculateGameDuration();

        // Sort players by earnings (descending)
        const sortedPlayers = [...this.players].sort((a, b) => {
            if (b.earnings !== a.earnings) {
                return b.earnings - a.earnings;
            }
            // If earnings are equal, sort by net score
            if (b.netScore !== a.netScore) {
                return b.netScore - a.netScore;
            }
            // If net score is equal, sort by blackjacks
            return b.blackjacks - a.blackjacks;
        });

        // Update scoreboard info
        this.gameDurationSpan.textContent = gameDuration;
        this.finalTotalPlayersSpan.textContent = this.players.length;

        const totalEarnings = this.players.reduce((sum, player) => sum + player.earnings, 0);
        this.finalTotalEarningsSpan.textContent = `💎${totalEarnings.toFixed(2)}`;

        // Update total earnings color
        this.finalTotalEarningsSpan.classList.remove('positive', 'negative', 'zero');
        if (totalEarnings > 0) {
            this.finalTotalEarningsSpan.classList.add('positive');
        } else if (totalEarnings < 0) {
            this.finalTotalEarningsSpan.classList.add('negative');
        } else {
            this.finalTotalEarningsSpan.classList.add('zero');
        }

        // Render scoreboard
        this.renderScoreboard(sortedPlayers);

        // Show scoreboard screen
        this.setupScreen.style.display = 'none';
        this.gameScreen.style.display = 'none';
        this.scoreboardScreen.style.display = 'block';
    }

    calculateGameDuration() {
        if (!this.gameStartTime) {
            return '--';
        }

        const now = new Date();
        const duration = now - this.gameStartTime;

        const hours = Math.floor(duration / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((duration % (1000 * 60)) / 1000);

        if (hours > 0) {
            return `${hours}h ${minutes}m ${seconds}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    }

    renderScoreboard(sortedPlayers) {
        // Performance optimization: Use DocumentFragment for batch DOM updates
        const fragment = document.createDocumentFragment();

        sortedPlayers.forEach((player, index) => {
            const scoreboardItem = this.createScoreboardItem(player, index + 1);
            fragment.appendChild(scoreboardItem);
        });

        // Clear and update in one operation
        this.scoreboardList.innerHTML = '';
        this.scoreboardList.appendChild(fragment);
    }

    createScoreboardItem(player, rank) {
        const itemElement = this.scoreboardItemTemplate.content.cloneNode(true);
        const item = itemElement.querySelector('.scoreboard-item');

        // Set rank
        item.querySelector('.rank-number').textContent = rank;

        // Set player info
        item.querySelector('.player-name').textContent = player.name;
        item.querySelector('.wins').textContent = player.wins;
        item.querySelector('.losses').textContent = player.losses;
        item.querySelector('.blackjacks').textContent = player.blackjacks;

        // Set scores
        const netScoreElement = item.querySelector('.net-score .value');
        netScoreElement.textContent = player.netScore.toFixed(1);

        const earningsElement = item.querySelector('.earnings .value');
        earningsElement.textContent = `💎${player.earnings.toFixed(2)}`;

        // Update earnings color
        earningsElement.classList.remove('positive', 'negative', 'zero');
        if (player.earnings > 0) {
            earningsElement.classList.add('positive');
        } else if (player.earnings < 0) {
            earningsElement.classList.add('negative');
        } else {
            earningsElement.classList.add('zero');
        }

        return itemElement;
    }

    revertPlayerAction(player, action) {
        // Revert the previous action
        switch (action) {
            case 'win':
                player.wins--;
                player.netScore -= 1;
                break;
            case 'loss':
                player.losses--;
                player.netScore += 1;
                break;
            case 'doubleWin':
                player.wins -= 2;
                player.netScore -= 2;
                break;
            case 'doubleLoss':
                player.losses -= 2;
                player.netScore += 2;
                break;
            case 'blackjack':
                player.blackjacks--;
                player.netScore -= 1.5;
                break;
            case 'tie':
                // Tie doesn't change any scores, nothing to revert
                break;
        }

        // Recalculate earnings
        if (action !== 'tie') {
            player.earnings = player.netScore * this.winValue;
        }
    }

    getActionName(action) {
        const actionNames = {
            win: 'Vitória',
            loss: 'Derrota',
            doubleWin: 'Vitória Dupla',
            doubleLoss: 'Derrota Dupla',
            blackjack: 'Blackjack',
            tie: 'Empate'
        };
        return actionNames[action] || action;
    }

    triggerBlackjackCelebration(playerCard) {
        // Add the blackjack celebration class
        playerCard.classList.add('blackjack-celebration');

        // Create sparks container
        const sparksContainer = document.createElement('div');
        sparksContainer.className = 'rocket-sparks';

        // Create individual sparks with optimized creation
        const sparkEmojis = ['⭐', '✨', '💫', '🌟'];
        const sparkFragment = document.createDocumentFragment();

        for (let i = 0; i < 4; i++) { // Reduced from 6 to 4 for better performance
            const spark = document.createElement('div');
            spark.className = 'spark';
            spark.textContent = sparkEmojis[i % sparkEmojis.length];

            // Random positioning
            spark.style.top = Math.random() * 70 + 15 + '%'; // Constrained range
            spark.style.left = Math.random() * 70 + 15 + '%'; // Constrained range
            spark.style.animationDelay = (Math.random() * 0.8) + 's'; // Shorter delays

            sparkFragment.appendChild(spark);
        }

        sparksContainer.appendChild(sparkFragment);
        playerCard.appendChild(sparksContainer);

        // Remove sparks after animation with optimized cleanup
        setTimeout(() => {
            if (sparksContainer.parentNode) {
                sparksContainer.parentNode.removeChild(sparksContainer);
            }
        }, 1200); // Reduced from 2000ms to match shorter animation
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

        // Use requestIdleCallback for better performance
        const saveOperation = () => {
            const gameState = {
                players: this.players,
                winValue: this.winValue,
                gameActive: this.gameActive,
                playerIdCounter: this.playerIdCounter,
                gameStartTime: this.gameStartTime ? this.gameStartTime.getTime() : null
            };

            try {
                localStorage.setItem('blackjackTracker', JSON.stringify(gameState));
            } catch (error) {
                console.error('Error saving to localStorage:', error);
                this.showMessage('Error saving game state', 'error');
            }

            this.isSaving = false;

            // Check if another save is pending
            if (this.pendingSave) {
                this.pendingSave = false;
                this.saveToStorage();
            }
        };

        // Use requestIdleCallback if available, otherwise use setTimeout
        if (window.requestIdleCallback) {
            requestIdleCallback(saveOperation);
        } else {
            setTimeout(saveOperation, 0);
        }
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
                this.gameStartTime = gameState.gameStartTime ? new Date(gameState.gameStartTime) : null;

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

    editPlayerName(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) return;

        const playerCard = document.querySelector(`[data-player-id="${playerId}"]`);
        if (!playerCard) return;

        const nameElement = playerCard.querySelector('.player-name');
        const editBtn = playerCard.querySelector('.edit-player-btn');

        // Check if already in edit mode
        if (nameElement.querySelector('input')) {
            return;
        }

        // Store original text
        const originalName = player.name;

        // Create input element
        const input = document.createElement('input');
        input.type = 'text';
        input.value = originalName;
        input.maxLength = 20;
        input.className = 'player-name-input';

        // Style the input to match the name appearance
        Object.assign(input.style, {
            background: 'transparent',
            border: '2px solid #3498db',
            borderRadius: '4px',
            color: '#2c3e50',
            fontSize: '1.3rem',
            fontWeight: '700',
            fontFamily: 'inherit',
            padding: '4px 8px',
            width: '100%',
            outline: 'none'
        });

        // Replace name text with input
        nameElement.textContent = '';
        nameElement.appendChild(input);

        // Focus and select text
        input.focus();
        input.select();

        // Change edit button to confirm/cancel buttons
        const actionsContainer = editBtn.parentNode;
        const originalEditBtn = editBtn.cloneNode(true);

        // Create confirm button
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'btn btn-success btn-small';
        confirmBtn.innerHTML = '<i class="fas fa-check"></i>';
        confirmBtn.style.marginRight = '4px';

        // Create cancel button  
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-secondary btn-small';
        cancelBtn.innerHTML = '<i class="fas fa-times"></i>';

        // Replace edit button with confirm/cancel
        actionsContainer.replaceChild(confirmBtn, editBtn);
        actionsContainer.insertBefore(cancelBtn, actionsContainer.lastElementChild);

        // Handle confirm
        const confirmEdit = () => {
            const newName = input.value.trim();

            if (!newName) {
                this.showMessage('Player name cannot be empty', 'error');
                input.focus();
                return;
            }

            if (newName.length > 20) {
                this.showMessage('Player name cannot exceed 20 characters', 'error');
                input.focus();
                return;
            }

            // Check if name already exists (excluding current player)
            const existingPlayer = this.players.find(p =>
                p.id !== playerId && p.name.toLowerCase() === newName.toLowerCase()
            );

            if (existingPlayer) {
                this.showMessage('A player with this name already exists', 'error');
                input.focus();
                return;
            }

            // Update player name
            player.name = newName;

            // Restore UI
            nameElement.textContent = newName;
            actionsContainer.replaceChild(originalEditBtn, confirmBtn);
            actionsContainer.removeChild(cancelBtn);

            // Re-bind edit button
            originalEditBtn.onclick = (e) => {
                e.stopPropagation();
                this.editPlayerName(player.id);
            };

            this.saveToStorage();
            this.showMessage(`Player name updated to "${newName}"`, 'success');
        };

        // Flag to track if editing was cancelled
        let editingCancelled = false;

        // Handle cancel
        const cancelEdit = () => {
            editingCancelled = true;
            // Restore original name
            nameElement.textContent = originalName;
            actionsContainer.replaceChild(originalEditBtn, confirmBtn);
            actionsContainer.removeChild(cancelBtn);

            // Re-bind edit button
            originalEditBtn.onclick = (e) => {
                e.stopPropagation();
                this.editPlayerName(player.id);
            };
        };

        // Bind events
        confirmBtn.onclick = (e) => {
            e.stopPropagation();
            confirmEdit();
        };

        cancelBtn.onclick = (e) => {
            e.stopPropagation();
            e.preventDefault(); // Prevent any default behavior
            cancelEdit();
        };

        // Handle Enter and Escape keys
        input.onkeydown = (e) => {
            e.stopPropagation();
            if (e.key === 'Enter') {
                confirmEdit();
            } else if (e.key === 'Escape') {
                cancelEdit();
            }
        };

        // Handle blur (click outside) - only confirm if not cancelled
        input.onblur = (e) => {
            // Check if the blur was caused by clicking on confirm or cancel buttons
            const relatedTarget = e.relatedTarget;
            if (relatedTarget === confirmBtn || relatedTarget === cancelBtn) {
                return; // Let the button handlers deal with this
            }

            // Small delay to allow any pending operations to complete
            setTimeout(() => {
                if (!editingCancelled) {
                    confirmEdit();
                }
            }, 50); // Reduced delay
        };
    }

    showAddPlayerModal() {
        this.newPlayerModalName.value = '';
        this.addPlayerModal.style.display = 'flex';
        setTimeout(() => {
            this.addPlayerModal.classList.add('show');
            this.newPlayerModalName.focus();
        }, 10);
    }

    hideAddPlayerModal() {
        this.addPlayerModal.classList.remove('show');
        setTimeout(() => {
            this.addPlayerModal.style.display = 'none';
        }, 300);
    }

    addPlayerFromModal() {
        const name = this.newPlayerModalName.value.trim();
        if (!name) {
            this.showMessage('Please enter a player name', 'error');
            this.newPlayerModalName.focus();
            return;
        }

        if (this.players.find(p => p.name.toLowerCase() === name.toLowerCase())) {
            this.showMessage('Player with this name already exists', 'error');
            this.newPlayerModalName.focus();
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
        this.renderPlayers();
        this.updateGameInfo();
        this.saveToStorage();
        this.hideAddPlayerModal();
        this.showMessage(`${name} added to the game`, 'success');
    }

    // ...existing code...
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const tracker = new BlackjackTracker();

    // Make it globally accessible for debugging
    window.blackjackTracker = tracker;

    console.log('Blackjack Score Tracker initialized successfully!');
});

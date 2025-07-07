# Blackjack Score Tracker

A comprehensive web application to track player scores and earnings in Blackjack games. This application allows you to manage multiple players, track their wins/losses, and automatically calculate earnings based on configurable win values.

## Features

### 🎮 Game Management

- **Initial Setup Screen**: Create players and set win value before starting a game
- **Dynamic Player Management**: Add or remove players during an active game
- **Configurable Win Value**: Set the monetary value per win (e.g., €0.05 per win)
- **Real-time Score Tracking**: Live updates of player statistics and earnings

### 📊 Player Tracking

- **Multiple Score Actions**:
  - Add 1 Win (+1 point)
  - Add 1 Loss (-1 point)
  - Add 2 Wins (+2 points)
  - Add 2 Losses (-2 points)
  - Add Blackjack (+1.5 points for natural blackjack)
- **Comprehensive Statistics**:
  - Total wins, losses, and blackjacks
  - Net score calculation
  - Earnings calculation (score × win value)
  - Win percentage

### 💰 Financial Tracking

- **Automatic Earnings Calculation**: Based on net score and win value
- **Positive/Negative Earnings**: Clear indication of profit or loss
- **Real-time Updates**: Earnings update immediately with score changes

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Modern CSS with Flexbox/Grid layout
- **Storage**: Local browser storage for session persistence
- **Responsive Design**: Works on desktop and mobile devices

## Installation & Setup

### Option 1: Direct Browser Usage

1. Clone or download this repository
2. Open `index.html` in any modern web browser
3. Start tracking your Blackjack games!

### Option 2: Local Development Server

```bash
# Clone the repository
git clone https://github.com/yourusername/Black-Jack-Tracker.git
cd Black-Jack-Tracker

# Start a local server (Python 3)
python -m http.server 8000

# Or with Node.js
npx serve .

# Open http://localhost:8000 in your browser
```

## How to Use

### 1. Initial Setup

1. **Launch the Application**: Open the app in your browser
2. **Add Players**: Enter player names in the setup screen
3. **Set Win Value**: Define the monetary value per win (e.g., 0.05 for €0.05)
4. **Start Game**: Click "Start Game" to begin tracking

### 2. During the Game

- **Track Scores**: Use the action buttons for each player:
  - `+1 Win`: Add one win
  - `+1 Loss`: Add one loss
  - `+2 Wins`: Add two wins (double down win)
  - `+2 Losses`: Add two losses (double down loss)
  - `Blackjack`: Add blackjack (1.5 points)
- **Add Players**: Use "Add Player" button to include new players mid-game
- **Remove Players**: Click the "Remove" button next to any player
- **Monitor Earnings**: View real-time earnings for each player

### 3. Game Management

- **Reset Game**: Clear all scores while keeping players and win value
- **New Game**: Return to setup to configure new players and win value
- **Session Persistence**: Your game state is automatically saved

## Game Rules & Scoring

### Point System

- **Regular Win**: +1 point
- **Regular Loss**: -1 point
- **Double Win**: +2 points (when doubling down and winning)
- **Double Loss**: -2 points (when doubling down and losing)
- **Blackjack**: +1.5 points (natural 21 with first two cards)

### Earnings Calculation

Player Earnings = Net Score × Win Value

**Example**:

- Net Score: +3 points (3 wins, 0 losses)
- Win Value: €0.05
- Earnings: 3 × €0.05 = €0.15

## File Structure

Black-Jack-Tracker/
├── index.html          # Main application file
├── styles.css          # Application styling
├── script.js           # Application logic
├── README.md           # This documentation
└── assets/             # Images and icons (if any)
    └── ...

## Features Roadmap

### Planned Features

- [ ] **Game History**: Save and review past game sessions
- [ ] **Export Data**: Export game results to CSV/PDF
- [ ] **Player Statistics**: Long-term player performance analytics
- [ ] **Multiple Game Modes**: Support for different Blackjack variants
- [ ] **Dark Mode**: Toggle between light and dark themes
- [ ] **Sound Effects**: Audio feedback for actions
- [ ] **Keyboard Shortcuts**: Quick actions via keyboard

### Advanced Features

- [ ] **Multi-table Support**: Track multiple Blackjack tables simultaneously
- [ ] **Tournament Mode**: Special scoring for tournament play
- [ ] **Betting Tracking**: Track actual bet amounts per hand
- [ ] **Side Bets**: Support for side bet tracking
- [ ] **Card Counting Aid**: Optional card counting assistance

## Contributing

We welcome contributions! Please follow these steps:

1. **Fork the Repository**: Create your own fork
2. **Create Feature Branch**: `git checkout -b feature/new-feature`
3. **Make Changes**: Implement your feature or fix
4. **Test Thoroughly**: Ensure all functionality works
5. **Commit Changes**: `git commit -m "Add new feature"`
6. **Push to Branch**: `git push origin feature/new-feature`
7. **Create Pull Request**: Submit your changes for review

### Development Guidelines

- Use semantic commit messages
- Follow existing code style and formatting
- Add comments for complex logic
- Test on multiple browsers
- Ensure responsive design compatibility

## Support

If you encounter any issues or have questions:

1. **Check the Issues**: Look for existing solutions
2. **Create New Issue**: Report bugs or request features
3. **Contact**: Reach out via email or social media

## Acknowledgments

- Inspired by the need for simple Blackjack game tracking
- Built with modern web technologies for optimal performance
- Designed for both casual and serious Blackjack players

---

## **Happy Gaming! 🃏♠️♥️♦️♣️**

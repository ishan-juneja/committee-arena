/**
 * main.js
 * Entry point for the Phaser 3 game.
 * Handles login screen and configures the game.
 */

import GameScene from "./scenes/GameScene.js";

// Wait for login before starting game
let gameInstance = null;
let playerName = '';
let playerColor = 0xFF6B6B; // Default to first color

// Check for saved session (reconnection)
const savedSession = localStorage.getItem('arenaSession');
const reconnectToken = localStorage.getItem('arenaReconnectToken');
let autoJoin = false;

if (savedSession) {
  try {
    const sessionData = JSON.parse(savedSession);
    playerName = sessionData.name;
    playerColor = sessionData.color;
    autoJoin = true;
    
    if (reconnectToken) {
      console.log('🔄 Found saved session + reconnect token, will restore your state...');
    } else {
      console.log('🔄 Found saved session, will auto-reconnect...');
    }
  } catch (e) {
    console.log('⚠️ Could not restore session');
    localStorage.removeItem('arenaSession');
    localStorage.removeItem('arenaReconnectToken');
  }
}

// Handle login
const loginScreen = document.getElementById('login-screen');
const playerNameInput = document.getElementById('player-name');
const joinButton = document.getElementById('join-button');
const randomNameBtn = document.getElementById('random-name-btn');
const controlsHint = document.getElementById('controls-hint');
const colorOptions = document.querySelectorAll('.color-option');

// Hide random name button (user doesn't want it)
if (randomNameBtn) {
  randomNameBtn.style.display = 'none';
}

// If we have a saved session, auto-join
if (autoJoin && playerName) {
  console.log('✅ Auto-joining with saved session...');
  loginScreen.classList.add('hidden');
  controlsHint.style.display = 'block';
  startGame();
} else {
  // Auto-focus name input
  playerNameInput.focus();
  
  // Color selection
  colorOptions[0].classList.add('selected'); // Select first color by default
  colorOptions.forEach(option => {
    option.addEventListener('click', () => {
      colorOptions.forEach(opt => opt.classList.remove('selected'));
      option.classList.add('selected');
      playerColor = parseInt(option.dataset.color, 16);
    });
  });

  // Join button
  joinButton.addEventListener('click', () => {
    playerName = playerNameInput.value.trim();
    if (playerName.length === 0) {
      alert("Please enter your name!");
      return;
    }
    
    // Save session for reconnection
    localStorage.setItem('arenaSession', JSON.stringify({
      name: playerName,
      color: playerColor,
      timestamp: Date.now()
    }));
    
    loginScreen.classList.add('hidden');
    controlsHint.style.display = 'block';
    startGame();
  });

  // Allow Enter key to join
  playerNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      joinButton.click();
    }
  });
}

/**
 * Start the Phaser game
 */
function startGame() {
  const config = {
    type: Phaser.AUTO,
    width: 800, // Fixed width for consistent game area
    height: 600, // Fixed height
    parent: 'game-container',
    backgroundColor: "#0b1020",
    scene: [GameScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    callbacks: {
      preBoot: (game) => {
        game.registry.set('playerName', playerName);
        game.registry.set('playerColor', playerColor);
      }
    }
  };

  gameInstance = new Phaser.Game(config);
}

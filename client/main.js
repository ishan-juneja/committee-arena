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
    const now = Date.now();
    const sessionAge = now - sessionData.timestamp;
    const MAX_SESSION_AGE = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    // Check if session is still valid (less than 24 hours old)
    if (sessionAge < MAX_SESSION_AGE) {
      playerName = sessionData.name;
      playerColor = sessionData.color;
      autoJoin = true;
      
      if (reconnectToken) {
        console.log('🔄 Found saved session + reconnect token, will restore your state...');
      } else {
        console.log('🔄 Found saved session, will auto-reconnect...');
      }
    } else {
      console.log('⏰ Session expired (older than 24 hours), please log in again');
      localStorage.removeItem('arenaSession');
      localStorage.removeItem('arenaReconnectToken');
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
    
    // Validate name
    if (playerName.length === 0) {
      alert("Please enter your name!");
      return;
    }
    
    if (playerName.length > 20) {
      alert("Name too long! Maximum 20 characters.");
      return;
    }
    
    if (playerName.length < 2) {
      alert("Name too short! Minimum 2 characters.");
      return;
    }
    
    // Check for special characters (allow only letters, numbers, spaces, and basic punctuation)
    if (!/^[a-zA-Z0-9 \-_]+$/.test(playerName)) {
      alert("Name contains invalid characters! Use only letters, numbers, spaces, hyphens, and underscores.");
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

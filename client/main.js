/**
 * main.js
 * Entry point for the Phaser 3 game.
 * Handles login screen and configures the game.
 */

import GameScene from "./scenes/GameScene.js";

// Wait for login before starting game
let gameInstance = null;
let playerName = null;

// Handle login
const loginScreen = document.getElementById('login-screen');
const playerNameInput = document.getElementById('player-name');
const joinButton = document.getElementById('join-button');
const controlsHint = document.getElementById('controls-hint');

// Auto-focus name input
playerNameInput.focus();

// Handle Enter key in input
playerNameInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    joinButton.click();
  }
});

joinButton.addEventListener('click', () => {
  const name = playerNameInput.value.trim();
  
  if (!name) {
    playerNameInput.style.borderColor = '#ff0000';
    playerNameInput.placeholder = 'Please enter a name!';
    playerNameInput.focus();
    return;
  }
  
  playerName = name;
  
  // Hide login screen
  loginScreen.classList.add('hidden');
  
  // Show controls hint
  controlsHint.style.display = 'block';
  setTimeout(() => {
    controlsHint.style.display = 'none';
  }, 5000);
  
  // Start the game
  startGame();
});

function startGame() {
  // Phaser game configuration
  const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: "#0b1020",
    parent: "game-container",
    scene: [GameScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    // Pass player name to game
    callbacks: {
      preBoot: (game) => {
        game.registry.set('playerName', playerName);
      }
    }
  };

  // Create and launch the game
  gameInstance = new Phaser.Game(config);
}

// Export for debugging
window.gameInstance = gameInstance;

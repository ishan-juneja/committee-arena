/**
 * main.js
 * Entry point for the Phaser 3 game.
 * Handles login screen and configures the game.
 */

import GameScene from "./scenes/GameScene.js";

// Wait for login before starting game
let gameInstance = null;
let playerName = null;
let playerColor = 0xFF6B6B; // Default red

// Handle login
const loginScreen = document.getElementById('login-screen');
const playerNameInput = document.getElementById('player-name');
const joinButton = document.getElementById('join-button');
const randomNameBtn = document.getElementById('random-name-btn');
const controlsHint = document.getElementById('controls-hint');
const colorOptions = document.querySelectorAll('.color-option');

// Random name generator
const randomNames = [
  "Ethan", "Hailey", "Sarah", "Manuela", "Elizabeth", "Yangyang",
  "Katie", "Mei", "Arielle", "Alex", "Jordan", "Taylor", "Morgan",
  "Casey", "Riley", "Avery", "Quinn", "Blake", "Charlie", "Drew"
];

function generateRandomName() {
  return randomNames[Math.floor(Math.random() * randomNames.length)];
}

// Auto-generate a random name on load
playerNameInput.value = generateRandomName();
playerNameInput.focus();
playerNameInput.select();

// Random name button
randomNameBtn.addEventListener('click', () => {
  playerNameInput.value = generateRandomName();
  playerNameInput.focus();
  playerNameInput.select();
});

// Color selection
colorOptions[0].classList.add('selected'); // Select first color by default
colorOptions.forEach(option => {
  option.addEventListener('click', () => {
    colorOptions.forEach(opt => opt.classList.remove('selected'));
    option.classList.add('selected');
    playerColor = parseInt(option.dataset.color, 16);
  });
});

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
    // Pass player name and color to game
    callbacks: {
      preBoot: (game) => {
        game.registry.set('playerName', playerName);
        game.registry.set('playerColor', playerColor);
      }
    }
  };

  // Create and launch the game
  gameInstance = new Phaser.Game(config);
}

// Export for debugging
window.gameInstance = gameInstance;

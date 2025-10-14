/**
 * main.js
 * Entry point for the Phaser 3 game.
 * Configures the game and registers the GameScene.
 */

import GameScene from "./scenes/GameScene.js";

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
};

// Create and launch the game
new Phaser.Game(config);


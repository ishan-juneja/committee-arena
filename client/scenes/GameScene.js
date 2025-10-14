/**
 * GameScene
 * Main game scene that integrates all components:
 * - Network communication with Colyseus server
 * - Player sprites and state management
 * - UI controls (joystick and attack button)
 * - Death screen overlays
 */

import Network from "../net/Network.js";
import PlayerSprite from "../entities/PlayerSprite.js";

// Committee definitions with emojis
const COMMITTEES = {
  "Leadership Events Directors": { emoji: "🏆", color: 0xFFD700 },
  "Interview With A Bruin (IWAB)": { emoji: "🎙", color: 0x4169E1 },
  "Coffee Chat Directors": { emoji: "☕", color: 0x8B4513 },
  "⭐ Associate Director": { emoji: "⭐", color: 0xFF69B4 },
};

/**
 * Determines committee based on player name
 * Uses 3-letter then 2-letter mapping for specific players
 * @param {string} name - Player's name
 * @returns {string} Committee name
 */
function getCommitteeFromName(name) {
  const clean = name.trim().toUpperCase();
  
  // 3-letter specific mapping (highest priority)
  const p3 = clean.slice(0, 3);
  const map3 = {
    "ETH": "Leadership Events Directors", // Ethan
    "HAI": "Leadership Events Directors", // Hailey
    "SAR": "Leadership Events Directors", // Sarah
    "MAN": "Interview With A Bruin (IWAB)", // Manuela
    "ELI": "Interview With A Bruin (IWAB)", // Elizabeth
    "YAN": "Interview With A Bruin (IWAB)", // Yangyang
    "KAT": "Coffee Chat Directors", // Katie
    "MEI": "Coffee Chat Directors", // Mei
    "ARI": "⭐ Associate Director", // Arielle (AD)
  };
  
  if (map3[p3]) return map3[p3];

  // 2-letter general mapping
  const p2 = clean.slice(0, 2);
  const map2 = {
    "ET": "Leadership Events Directors",
    "HA": "Leadership Events Directors",
    "SA": "Leadership Events Directors",
    "MA": "Interview With A Bruin (IWAB)",
    "EL": "Interview With A Bruin (IWAB)",
    "YA": "Interview With A Bruin (IWAB)",
    "KA": "Coffee Chat Directors",
    "ME": "Coffee Chat Directors",
    "AR": "⭐ Associate Director",
  };
  
  if (map2[p2]) return map2[p2];
  
  // Default: randomly assign to prevent collision
  const committees = [
    "Leadership Events Directors",
    "Interview With A Bruin (IWAB)",
    "Coffee Chat Directors"
  ];
  return committees[Math.floor(Math.random() * committees.length)];
}

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
    this.lastNetworkUpdate = 0;
    this.networkUpdateInterval = 50; // Send updates every 50ms (20 times/sec) instead of 60fps
    this.keys = null; // Keyboard controls
  }

  /**
   * create
   * Called when the scene is created.
   * Initializes network connection, UI, and sets up event listeners.
   */
  async create() {
    console.log("🎮 Game Scene Created");
    
    // Add improved background
    this.createBackground();
    
    // Add title with shadow
    const title = this.add.text(400, 20, "⚔️ COMMITTEE ARENA ⚔️", {
      fontSize: "28px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(100);
    
    // Add pulsing effect to title
    this.tweens.add({
      targets: title,
      scale: 1.05,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Initialize network
    this.network = new Network();
    
    // Get player name and color from game registry (set by main.js)
    const playerName = this.game.registry.get('playerName') || 'Guest' + Math.floor(Math.random() * 1000);
    const playerColor = this.game.registry.get('playerColor') || 0xFF6B6B;
    
    // Store player color for later use
    this.myPlayerColor = playerColor;
    
    // Determine committee based on name
    const playerCommittee = getCommitteeFromName(playerName);
    
    console.log(`🎯 You are: ${playerName} from ${playerCommittee}`);
    console.log(`🎨 Your color: ${playerColor.toString(16)}`);
    
    try {
      // Store player sprites by ID
      this.players = {};
      
      // Set up network join with proper state listener setup
      // Pass reconnection token if available
      const reconnectToken = localStorage.getItem('arenaReconnectToken');
      this.room = await this.network.join(playerName, playerCommittee, playerColor, reconnectToken);
      this.mySessionId = this.room.sessionId;
      
      console.log(`🔗 Connected! Session ID: ${this.mySessionId}`);
      
      // Set up server state listeners IMMEDIATELY after joining
      // This ensures we catch all player additions including existing players
      this.setupStateListeners();
      
      // Show keyboard controls hint
      const hint = this.add.text(400, 560, "WASD: Move | SPACE: Attack", {
        fontSize: "14px",
        color: "#ffffff",
        backgroundColor: "#000000",
        padding: { x: 10, y: 5 }
      }).setOrigin(0.5).setDepth(100).setAlpha(0.7);
      
      // Set up death event listener
      this.room.onMessage("death", (data) => this.showDeathScreen(data));
      
      // Set up winner event listener
      this.room.onMessage("winner", (data) => this.showWinnerScreen(data));
      
      // Set up error handling
      this.room.onError((code, message) => {
        console.error(`❌ Room error (${code}):`, message);
        this.showErrorScreen(`Connection error: ${message}`);
      });
      
      // Handle disconnection
      this.room.onLeave((code) => {
        console.log(`👋 Left room with code: ${code}`);
        if (code !== 1000) { // 1000 = normal closure
          this.showErrorScreen("Disconnected from server");
        }
      });
      
      // Setup keyboard controls AFTER everything else is ready
      this.setupKeyboardControls();
      
      // Add reset button (only for first player - check if you're the only one or first to join)
      this.addResetButton();
      
      console.log("🎮 Game fully initialized and ready!");
      
    } catch (error) {
      console.error("Failed to connect:", error);
      this.add.text(400, 300, "❌ Failed to connect to server", {
        fontSize: "20px",
        color: "#ff0000",
      }).setOrigin(0.5);
    }
  }

  /**
   * Sets up keyboard controls (WASD + Space)
   */
  setupKeyboardControls() {
    console.log("⌨️ Setting up keyboard controls...");
    
    if (!this.input || !this.input.keyboard) {
      console.error("❌ Keyboard input not available!");
      return;
    }
    
    // Create keyboard input
    this.keys = {
      W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      SPACE: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
    };
    
    // Prevent keys from scrolling page
    this.input.keyboard.addCapture([
      Phaser.Input.Keyboard.KeyCodes.W,
      Phaser.Input.Keyboard.KeyCodes.A,
      Phaser.Input.Keyboard.KeyCodes.S,
      Phaser.Input.Keyboard.KeyCodes.D,
      Phaser.Input.Keyboard.KeyCodes.SPACE
    ]);
    
    // Track if space was just pressed (for attack cooldown)
    this.lastSpacePress = 0;
    
    console.log("✅ Keyboard controls set up!", this.keys);
  }

  /**
   * Creates a high-fidelity, balanced arena background
   */
  createBackground() {
    // Add dark gradient base
    const bg = this.add.rectangle(400, 300, 800, 600, 0x0a0e1a, 1);
    
    // Create main grid
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x1e2d47, 1);
    
    // Vertical lines
    for (let x = 0; x <= 800; x += 50) {
      graphics.lineBetween(x, 0, x, 600);
    }
    
    // Horizontal lines
    for (let y = 0; y <= 600; y += 50) {
      graphics.lineBetween(0, y, 800, y);
    }
    
    // Add thicker accent lines every 100px
    graphics.lineStyle(2, 0x2a4165, 0.6);
    for (let x = 0; x <= 800; x += 100) {
      graphics.lineBetween(x, 0, x, 600);
    }
    for (let y = 0; y <= 600; y += 100) {
      graphics.lineBetween(0, y, 800, y);
    }
    
    // Outer border - double frame
    graphics.lineStyle(3, 0x4a6fa5, 0.8);
    graphics.strokeRect(0, 0, 800, 600);
    graphics.lineStyle(2, 0x667eea, 0.6);
    graphics.strokeRect(8, 8, 784, 584);
    
    // Center arena circles - perfectly centered
    graphics.lineStyle(2, 0x667eea, 0.5);
    graphics.strokeCircle(400, 300, 100);
    graphics.lineStyle(2, 0x667eea, 0.3);
    graphics.strokeCircle(400, 300, 150);
    
    // Center dot
    graphics.fillStyle(0x667eea, 0.6);
    graphics.fillCircle(400, 300, 4);
    
    // Corner accent marks
    const cornerSize = 30;
    graphics.lineStyle(3, 0x667eea, 0.7);
    // Top-left
    graphics.lineBetween(15, 15, 15 + cornerSize, 15);
    graphics.lineBetween(15, 15, 15, 15 + cornerSize);
    // Top-right
    graphics.lineBetween(785, 15, 785 - cornerSize, 15);
    graphics.lineBetween(785, 15, 785, 15 + cornerSize);
    // Bottom-left
    graphics.lineBetween(15, 585, 15 + cornerSize, 585);
    graphics.lineBetween(15, 585, 15, 585 - cornerSize);
    // Bottom-right
    graphics.lineBetween(785, 585, 785 - cornerSize, 585);
    graphics.lineBetween(785, 585, 785, 585 - cornerSize);
    
    // Subtle glow in center
    graphics.fillStyle(0x667eea, 0.03);
    graphics.fillCircle(400, 300, 180);
  }

  /**
   * Creates a player sprite (extracted method for reuse)
   */
  createPlayerSprite(player, sessionId) {
    console.log(`➕ Creating sprite: ${player.name} at (${player.x}, ${player.y})`);
    
    // Use color from server state (synced across all clients)
    // This ensures everyone sees the same color for each player
    const color = player.color || 0xffffff;
    
    console.log(`🔍 Creating sprite for ${player.name} at (${player.x}, ${player.y}) with color 0x${color.toString(16)}`);
    
    // Create player sprite
    const playerSprite = new PlayerSprite(
      this, 
      sessionId, 
      player.name,
      color
    );
    
    console.log(`🔍 Sprite object created, now setting position...`);
    
    // Set initial position - CRITICAL!
    playerSprite.x = player.x;
    playerSprite.y = player.y;
    playerSprite.targetX = player.x;
    playerSprite.targetY = player.y;
    playerSprite.setPosition(player.x, player.y);
    playerSprite.updatePosition(player.x, player.y);
    playerSprite.updateHP(player.hp);
    
    console.log(`🔍 Position set: Container at (${playerSprite.x}, ${playerSprite.y}), visible: ${playerSprite.visible}, depth: ${playerSprite.depth}`);
    
    // Make absolutely sure it's visible and on top
    playerSprite.setVisible(true);
    playerSprite.setActive(true);
    playerSprite.setDepth(100); // WAY above background
    
    // Highlight own player with yellow glow
    if (sessionId === this.mySessionId) {
      playerSprite.body.setStrokeStyle(4, 0xffff00, 1);
      console.log(`💛 Yellow glow added to YOUR player!`);
    }
    
    this.players[sessionId] = playerSprite;
    
    console.log(`✅ Player sprite FULLY CREATED at (${playerSprite.x}, ${playerSprite.y})`);
    console.log(`📊 Total players in scene: ${Object.keys(this.players).length}`);
    
    // Listen for changes to this specific player using Colyseus Schema .listen()
    // Store listener callbacks so we can remove them later
    const listeners = [];
    
    listeners.push(player.listen("x", (currentValue, previousValue) => {
      const sprite = this.players[sessionId];
      if (sprite) sprite.updatePosition(player.x, player.y);
    }));
    
    listeners.push(player.listen("y", (currentValue, previousValue) => {
      const sprite = this.players[sessionId];
      if (sprite) sprite.updatePosition(player.x, player.y);
    }));
    
    listeners.push(player.listen("hp", (currentValue, previousValue) => {
      const sprite = this.players[sessionId];
      if (sprite) sprite.updateHP(currentValue);
    }));
    
    listeners.push(player.listen("attacking", (currentValue, previousValue) => {
      const sprite = this.players[sessionId];
      if (sprite && currentValue === true) {
        console.log(`💥 ${player.name} attacking!`);
        sprite.showAttacking();
      }
    }));
    
    // Store listeners on the sprite for cleanup
    playerSprite.schemaListeners = listeners;
    
    return playerSprite;
  }

  /**
   * Sets up listeners for server state changes
   * Handles player additions, removals, and updates
   */
  setupStateListeners() {
    console.log("🎧 Setting up state listeners...");
    
    // When a new player joins (or when we first sync with existing players)
    this.room.state.players.onAdd = (player, sessionId) => {
      console.log(`🆕 Player detected: ${player.name} at (${player.x}, ${player.y})`);
      
      // Avoid double creation
      if (this.players[sessionId]) {
        console.log(`⚠️ Player ${player.name} sprite already exists, skipping creation`);
        return;
      }
      
      this.createPlayerSprite(player, sessionId);
    };

    // When a player leaves
    this.room.state.players.onRemove = (player, sessionId) => {
      console.log(`➖ Player left: ${player.name}`);
      
      const sprite = this.players[sessionId];
      if (sprite) {
        // Clean up schema listeners to prevent memory leaks
        if (sprite.schemaListeners) {
          sprite.schemaListeners.forEach(listener => {
            if (listener && typeof listener === 'function') {
              listener(); // Call the listener to unsubscribe
            }
          });
          sprite.schemaListeners = null;
        }
        
        sprite.destroy();
        delete this.players[sessionId];
      }
    };
    
    console.log("✅ State listeners set up!");
  }

  /**
   * update
   * Called every frame.
   * Handles smooth interpolation, keyboard/joystick input, and throttled network updates.
   */
  update(time) {
    if (!this.network || !this.room) return;
    
    // Debug: Check if keys exist
    if (!this.keys) {
      console.warn("⚠️ Keys not initialized yet!");
      return;
    }
    
    // Smooth interpolation for all players (prevents choppy movement)
    for (const id in this.players) {
      const sprite = this.players[id];
      if (sprite && sprite.smoothUpdate) {
        sprite.smoothUpdate();
      }
    }
    
    // Get movement vector from keyboard
    let vec = { x: 0, y: 0 };
    
    // Check if player is alive
    const myPlayer = this.players[this.mySessionId];
    const isAlive = myPlayer && myPlayer.hp > 0;
    
    if (this.keys && isAlive) {
      // Desktop: use WASD keys (only if alive)
      if (this.keys.W.isDown) vec.y = -1;
      if (this.keys.S.isDown) vec.y = 1;
      if (this.keys.A.isDown) vec.x = -1;
      if (this.keys.D.isDown) vec.x = 1;
      
      // Normalize diagonal movement
      if (vec.x !== 0 && vec.y !== 0) {
        const magnitude = Math.sqrt(vec.x * vec.x + vec.y * vec.y);
        vec.x /= magnitude;
        vec.y /= magnitude;
      }
      
      // Manual attack with SPACE bar (500ms cooldown)
      if (this.keys.SPACE.isDown && time - this.lastSpacePress > 500) {
        this.network.sendAttack();
        this.lastSpacePress = time;
      }
    }
    
    // Throttle network updates to prevent excessive traffic
    // Only send position updates every 50ms instead of every frame (60fps)
    // This allows 8-12 players to play smoothly without network congestion
    if (time - this.lastNetworkUpdate > this.networkUpdateInterval) {
      this.network.sendMove(vec);
      this.lastNetworkUpdate = time;
    }
  }

  /**
   * Shows death screen overlay when a player dies
   * @param {{id: string, committee: string, killerName: string}} data - Death event data
   */
  showDeathScreen(data) {
    const committee = COMMITTEES[data.committee] || { emoji: "💀" };
    const emoji = committee.emoji;
    
    console.log(`💀 Player ${data.id} died! Committee: ${data.committee}`);
    
    // Get the dead player's sprite to show emoji above them
    const deadSprite = this.players[data.id];
    
    if (deadSprite) {
      // Create small emoji (same size as player - 24px diameter = player size)
      const emojiOverlay = this.add.text(
        deadSprite.x, 
        deadSprite.y, 
        emoji, 
        { fontSize: "20px" } // Small size, same as player
      ).setOrigin(0.5).setDepth(3000);
      
      // Gentle pulse animation
      this.tweens.add({
        targets: emojiOverlay,
        scale: 1.1,
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });
      
      // Keep emoji visible for 7 seconds, then fade out
      this.tweens.add({
        targets: emojiOverlay,
        alpha: 0,
        duration: 2000,
        delay: 7000, // Show for 7 seconds
        onComplete: () => {
          emojiOverlay.destroy();
        }
      });
    }
    
    // If it's YOUR death, show full-screen overlay
    if (data.id === this.mySessionId) {
      const overlay = this.add.rectangle(
        400, 300, 800, 600, 0x000000, 0.7
      ).setDepth(2000);
      
      const emojiText = this.add.text(
        400, 250, emoji, 
        { fontSize: "80px" }
      ).setOrigin(0.5).setDepth(2001);
      
      const youDiedText = this.add.text(
        400, 350, "YOU DIED!",
        { fontSize: "32px", color: "#ff0000", fontStyle: "bold" }
      ).setOrigin(0.5).setDepth(2001);
      
      const committeeText = this.add.text(
        400, 400, `You were: ${data.committee}`,
        { fontSize: "20px", color: "#ffffff" }
      ).setOrigin(0.5).setDepth(2001);
      
      const killerText = this.add.text(
        400, 440, `Defeated by ${data.killerName}`,
        { fontSize: "18px", color: "#ff9999" }
      ).setOrigin(0.5).setDepth(2001);
      
      // Keep your death screen for 5 seconds before fading
      this.tweens.add({
        targets: [overlay, emojiText, youDiedText, committeeText, killerText],
        alpha: 0,
        duration: 2000,
        delay: 5000,
        onComplete: () => {
          overlay.destroy();
          emojiText.destroy();
          youDiedText.destroy();
          committeeText.destroy();
          killerText.destroy();
        }
      });
    }
  }

  /**
   * Shows winner screen when only 1 player is left alive
   */
  showWinnerScreen(data) {
    console.log(`🏆 ${data.name} wins!`);
    
    // Full-screen winner overlay
    const overlay = this.add.rectangle(
      400, 300, 800, 600, 0x000000, 0.8
    ).setDepth(4000);
    
    const trophy = this.add.text(
      400, 200, "🏆", 
      { fontSize: "100px" }
    ).setOrigin(0.5).setDepth(4001);
    
    const winnerText = this.add.text(
      400, 320, `${data.name} WINS!`,
      { fontSize: "48px", color: "#FFD700", fontStyle: "bold" }
    ).setOrigin(0.5).setDepth(4001);
    
    // Pulse animation
    this.tweens.add({
      targets: trophy,
      scale: 1.2,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
    
    // If it's you, show special message
    if (data.id === this.mySessionId) {
      const youWonText = this.add.text(
        400, 390, "YOU ARE THE CHAMPION!",
        { fontSize: "20px", color: "#FFD700", fontStyle: "italic" }
      ).setOrigin(0.5).setDepth(4001);
    }
  }

  /**
   * Adds a reset button (visible to all, resets server state)
   */
  addResetButton() {
    const resetBtn = this.add.text(
      750, 20, "🔄 Reset",
      { 
        fontSize: "16px", 
        color: "#ffffff",
        backgroundColor: "#ff4444",
        padding: { x: 10, y: 5 },
        borderRadius: 5
      }
    ).setOrigin(1, 0).setDepth(5000).setInteractive();
    
    resetBtn.on('pointerdown', () => {
      // Confirm before resetting
      const confirmed = confirm("Are you sure you want to reset the game? This will reset all players and reload the page.");
      
      if (!confirmed) {
        return;
      }
      
      console.log("🔄 Resetting game...");
      
      // Send reset to server to reset all player states
      this.network.sendReset();
      
      // Reload page after short delay to reset UI state
      // Keep session data so players stay logged in
      setTimeout(() => {
        window.location.reload();
      }, 500);
    });
    
    resetBtn.on('pointerover', () => {
      resetBtn.setStyle({ backgroundColor: "#ff6666" });
    });
    
    resetBtn.on('pointerout', () => {
      resetBtn.setStyle({ backgroundColor: "#ff4444" });
    });
  }

  /**
   * Shows error screen when connection is lost
   */
  showErrorScreen(message) {
    const overlay = this.add.rectangle(
      400, 300, 800, 600, 0x000000, 0.9
    ).setDepth(9000);
    
    const errorText = this.add.text(
      400, 250, "⚠️ CONNECTION ERROR",
      { fontSize: "32px", color: "#ff0000", fontStyle: "bold" }
    ).setOrigin(0.5).setDepth(9001);
    
    const messageText = this.add.text(
      400, 310, message,
      { fontSize: "18px", color: "#ffffff" }
    ).setOrigin(0.5).setDepth(9001);
    
    const reloadText = this.add.text(
      400, 370, "Click to reload",
      { fontSize: "16px", color: "#aaaaaa" }
    ).setOrigin(0.5).setDepth(9001);
    
    // Make overlay clickable to reload
    overlay.setInteractive();
    overlay.on('pointerdown', () => {
      window.location.reload();
    });
  }

  /**
   * Called when scene is shut down
   */
  shutdown() {
    if (this.network) {
      this.network.disconnect();
    }
  }
}


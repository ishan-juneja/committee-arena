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
import Joystick from "../ui/Joystick.js";
import AttackButton from "../ui/AttackButton.js";

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
    this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
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
    
    // Setup keyboard controls (WASD + Space)
    this.setupKeyboardControls();
    
    try {
      // Join the arena room
      this.room = await this.network.join(playerName, playerCommittee);
      
      // Store player sprites by ID
      this.players = {};
      this.mySessionId = this.room.sessionId;
      
      // Create UI controls (only on mobile devices)
      if (this.isMobile) {
        this.joystick = new Joystick(this);
        this.attackBtn = new AttackButton(this, () => this.network.sendAttack());
      } else {
        // Show keyboard controls hint for desktop
        const hint = this.add.text(400, 560, "WASD: Move | SPACE: Attack", {
          fontSize: "14px",
          color: "#ffffff",
          backgroundColor: "#000000",
          padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setDepth(100).setAlpha(0.7);
      }
      
      // Set up server state listeners
      this.setupStateListeners();
      
      // Set up death event listener
      this.room.onMessage("death", (data) => this.showDeathScreen(data));
      
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
    // Create keyboard input
    this.keys = {
      W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      SPACE: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
    };
    
    // Prevent space from scrolling page
    this.input.keyboard.addCapture('W,A,S,D,SPACE');
    
    // Track if space was just pressed (for attack cooldown)
    this.lastSpacePress = 0;
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
   * Sets up listeners for server state changes
   * Handles player additions, removals, and updates
   */
  setupStateListeners() {
    // When a new player joins
    this.room.state.players.onAdd = (player, sessionId) => {
      console.log(`➕ Player joined: ${player.name} at (${player.x}, ${player.y})`);
      
      // Use player's selected color if it's the local player, otherwise use committee color
      let color;
      if (sessionId === this.mySessionId) {
        color = this.myPlayerColor;
      } else {
        const committee = COMMITTEES[player.committee] || { color: 0xffffff };
        color = committee.color;
      }
      
      // Create player sprite
      const playerSprite = new PlayerSprite(
        this, 
        sessionId, 
        player.name,
        color
      );
      
      // Set initial position (CRITICAL - this was missing!)
      playerSprite.x = player.x;
      playerSprite.y = player.y;
      playerSprite.targetX = player.x;
      playerSprite.targetY = player.y;
      playerSprite.updatePosition(player.x, player.y);
      playerSprite.updateHP(player.hp);
      
      // Highlight own player with yellow glow
      if (sessionId === this.mySessionId) {
        playerSprite.body.setStrokeStyle(3, 0xffff00, 1);
      }
      
      this.players[sessionId] = playerSprite;
      
      console.log(`✅ Player sprite created at (${playerSprite.x}, ${playerSprite.y})`);
      
      // Listen for changes to this specific player
      player.onChange = () => {
        const sprite = this.players[sessionId];
        if (sprite) {
          sprite.updatePosition(player.x, player.y);
          sprite.updateHP(player.hp);
          
          if (player.attacking) {
            sprite.showAttacking();
          }
        }
      };
    };

    // When a player leaves
    this.room.state.players.onRemove = (player, sessionId) => {
      console.log(`➖ Player left: ${player.name}`);
      
      const sprite = this.players[sessionId];
      if (sprite) {
        sprite.destroy();
        delete this.players[sessionId];
      }
    };
  }

  /**
   * update
   * Called every frame.
   * Handles smooth interpolation, keyboard/joystick input, and throttled network updates.
   */
  update(time) {
    if (!this.network) return;
    
    // Smooth interpolation for all players (prevents choppy movement)
    for (const id in this.players) {
      const sprite = this.players[id];
      if (sprite && sprite.smoothUpdate) {
        sprite.smoothUpdate();
      }
    }
    
    // Get movement vector from keyboard or joystick
    let vec = { x: 0, y: 0 };
    
    if (this.isMobile && this.joystick) {
      // Mobile: use joystick
      vec = this.joystick.getVector();
    } else if (this.keys) {
      // Desktop: use WASD keys
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
      
      // Handle spacebar attack with cooldown
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
    
    console.log(`💀 ${data.id} died! Committee: ${data.committee}`);
    
    // Create overlay background
    const overlay = this.add.rectangle(
      400, 300, 800, 600, 0x000000, 0.7
    ).setDepth(2000);
    
    // Create emoji and text
    const emojiText = this.add.text(
      400, 250, emoji, 
      { fontSize: "80px" }
    ).setOrigin(0.5).setDepth(2001);
    
    const committeeText = this.add.text(
      400, 350, data.committee,
      { fontSize: "32px", color: "#ffffff", fontStyle: "bold" }
    ).setOrigin(0.5).setDepth(2001);
    
    const killerText = this.add.text(
      400, 400, `Defeated by ${data.killerName}`,
      { fontSize: "18px", color: "#ff9999" }
    ).setOrigin(0.5).setDepth(2001);
    
    // Fade out animation
    this.tweens.add({
      targets: [overlay, emojiText, committeeText, killerText],
      alpha: 0,
      duration: 3000,
      delay: 1500,
      onComplete: () => {
        overlay.destroy();
        emojiText.destroy();
        committeeText.destroy();
        killerText.destroy();
      }
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


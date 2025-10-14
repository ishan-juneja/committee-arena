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
  }

  /**
   * create
   * Called when the scene is created.
   * Initializes network connection, UI, and sets up event listeners.
   */
  async create() {
    console.log("🎮 Game Scene Created");
    
    // Add background grid for visual reference
    this.createBackground();
    
    // Add title
    this.add.text(400, 20, "⚔️ COMMITTEE ARENA ⚔️", {
      fontSize: "24px",
      color: "#ffffff",
      fontStyle: "bold",
    }).setOrigin(0.5);
    
    // Initialize network
    this.network = new Network();
    
    // Ask player for their name
    const playerName = this.promptPlayerName();
    
    // Determine committee based on name
    const playerCommittee = getCommitteeFromName(playerName);
    
    console.log(`🎯 You are: ${playerName} from ${playerCommittee}`);
    
    try {
      // Join the arena room
      this.room = await this.network.join(playerName, playerCommittee);
      
      // Store player sprites by ID
      this.players = {};
      this.mySessionId = this.room.sessionId;
      
      // Create UI controls
      this.joystick = new Joystick(this);
      this.attackBtn = new AttackButton(this, () => this.network.sendAttack());
      
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
   * Prompts the player for their name
   * @returns {string} Player's chosen name
   */
  promptPlayerName() {
    let name = prompt("Enter your name:");
    if (!name || name.trim() === "") {
      name = "Guest" + Math.floor(Math.random() * 1000);
    }
    return name.trim();
  }

  /**
   * Creates a background grid pattern
   */
  createBackground() {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x1a2332, 0.5);
    
    // Vertical lines
    for (let x = 0; x <= 800; x += 50) {
      graphics.lineBetween(x, 0, x, 600);
    }
    
    // Horizontal lines
    for (let y = 0; y <= 600; y += 50) {
      graphics.lineBetween(0, y, 800, y);
    }
  }

  /**
   * Sets up listeners for server state changes
   * Handles player additions, removals, and updates
   */
  setupStateListeners() {
    // When a new player joins
    this.room.state.players.onAdd = (player, sessionId) => {
      console.log(`➕ Player joined: ${player.name}`);
      
      // Determine color based on committee
      const committee = COMMITTEES[player.committee] || { color: 0xffffff };
      const color = committee.color;
      
      // Create player sprite
      const playerSprite = new PlayerSprite(
        this, 
        sessionId, 
        player.name,
        color
      );
      
      playerSprite.updatePosition(player.x, player.y);
      playerSprite.updateHP(player.hp);
      
      // Highlight own player
      if (sessionId === this.mySessionId) {
        playerSprite.body.setStrokeStyle(3, 0xffff00);
      }
      
      this.players[sessionId] = playerSprite;
      
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
   * Handles smooth interpolation and throttled network updates.
   */
  update(time) {
    if (!this.joystick || !this.network) return;
    
    // Smooth interpolation for all players (prevents choppy movement)
    for (const id in this.players) {
      const sprite = this.players[id];
      if (sprite && sprite.smoothUpdate) {
        sprite.smoothUpdate();
      }
    }
    
    // Throttle network updates to prevent excessive traffic
    // Only send position updates every 50ms instead of every frame (60fps)
    // This allows 8-12 players to play smoothly without network congestion
    if (time - this.lastNetworkUpdate > this.networkUpdateInterval) {
      const vec = this.joystick.getVector();
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


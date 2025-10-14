import { Room, Client } from "colyseus";
import { ArenaState } from "./schema/ArenaState";
import { PlayerState } from "./schema/PlayerState";

// Constants for game mechanics
const PUNCH_RADIUS = 33; // Reduced by 1/3 from 50
const ATTACK_DURATION_MS = 300;
const ATTACK_COOLDOWN_MS = 500; // Prevent spam attacks (0.5 second cooldown)
const SPAWN_X_MIN = 100;
const SPAWN_X_MAX = 700;
const SPAWN_Y_MIN = 100;
const SPAWN_Y_MAX = 500;

/**
 * ArenaRoom
 * The main game room that handles:
 * - Player connections and disconnections
 * - Movement updates from clients
 * - Attack mechanics and damage calculation
 * - Broadcasting death events
 */
export class ArenaRoom extends Room<ArenaState> {
  
  // Track last attack time for each player (prevents spam)
  private lastAttackTime: Map<string, number> = new Map();
  
  /**
   * onCreate
   * Called when the room is created.
   * Sets up the initial game state and message handlers.
   */
  onCreate() {
    this.setState(new ArenaState());

    // Handle player movement messages
    // Clients send { dx, dy } to move their character
    this.onMessage("move", (client, data) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) {
        console.log(`⚠️ Move message from unknown player: ${client.sessionId}`);
        return;
      }
      
      // Only process if there's actual movement
      if (data.dx === 0 && data.dy === 0) return;
      
      const oldX = player.x;
      const oldY = player.y;
      
      // Update player position based on movement vector
      player.x += data.dx;
      player.y += data.dy;
      
      // Keep player within bounds
      player.x = Math.max(0, Math.min(800, player.x));
      player.y = Math.max(0, Math.min(600, player.y));
      
      console.log(`🚶 ${player.name} moved: (${oldX.toFixed(0)}, ${oldY.toFixed(0)}) → (${player.x.toFixed(0)}, ${player.y.toFixed(0)})`);
    });

    // Handle attack messages
    // When a player attacks, check if any other players are in range
    this.onMessage("attack", (client) => {
      const attacker = this.state.players.get(client.sessionId);
      if (!attacker || attacker.hp <= 0) return;
      
      // Check attack cooldown to prevent spam
      const now = Date.now();
      const lastAttack = this.lastAttackTime.get(client.sessionId) || 0;
      if (now - lastAttack < ATTACK_COOLDOWN_MS) {
        // Still on cooldown, ignore attack
        return;
      }
      
      // Update last attack time
      this.lastAttackTime.set(client.sessionId, now);

      // Set attacking flag (useful for animations on client)
      attacker.attacking = true;
      console.log(`👊 ${attacker.name} is attacking at (${attacker.x.toFixed(0)}, ${attacker.y.toFixed(0)})`)
      
      // Check all other players for hits
      for (const [targetId, target] of this.state.players.entries()) {
        // Don't hit yourself
        if (targetId === client.sessionId) continue;
        
        // Skip dead players
        if (target.hp <= 0) continue;
        
        // Calculate distance between attacker and target
        const dx = attacker.x - target.x;
        const dy = attacker.y - target.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If within punch radius, deal damage
        if (distance < PUNCH_RADIUS) {
          target.hp -= 1;
          
          // Broadcast death event if player died
          if (target.hp <= 0) {
            this.broadcast("death", {
              id: targetId,
              committee: target.committee,
              killerName: attacker.name,
            });
            
            // Check if there's a winner after death
            this.checkForWinner();
          }
        }
      }
      
      // Reset attacking flag after animation duration
      setTimeout(() => {
        if (attacker) attacker.attacking = false;
      }, ATTACK_DURATION_MS);
    });
    
    // Handle reset message
    this.onMessage("reset", (client) => {
      console.log(`🔄 Reset requested by ${client.sessionId}`);
      // Reset all players to full health and respawn
      let playerIndex = 0;
      for (const [sessionId, player] of this.state.players.entries()) {
        player.hp = 3;
        const spawnPos = this.getSpawnPosition(playerIndex);
        player.x = spawnPos.x;
        player.y = spawnPos.y;
        player.attacking = false;
        playerIndex++;
      }
      console.log(`✅ All ${this.state.players.size} players reset`);
    });
  }

  /**
   * onJoin
   * Called when a new player connects.
   * Creates a new PlayerState and adds it to the game.
   */
  /**
   * Get evenly distributed spawn position for new player
   */
  private getSpawnPosition(playerIndex: number): { x: number, y: number } {
    // Spawn positions in a circle around the center
    const centerX = 400;
    const centerY = 300;
    const radius = 120; // Distance from center
    
    const angle = (playerIndex / 12) * Math.PI * 2; // Divide circle into 12 sections
    
    return {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius
    };
  }

  onJoin(client: Client, options: any) {
    const player = new PlayerState();
    player.id = client.sessionId;
    player.name = options.name || "Guest";
    player.committee = options.committee || "Leadership Events Directors";
    player.color = options.color || 0xffffff; // Sync color from client
    
    // Spawn player at evenly distributed position
    const playerIndex = this.state.players.size;
    const spawnPos = this.getSpawnPosition(playerIndex);
    player.x = spawnPos.x;
    player.y = spawnPos.y;
    player.hp = 3;
    
    // Add player to game state
    this.state.players.set(client.sessionId, player);
    
    console.log(`✅ ${player.name} joined as ${player.committee} at position (${player.x.toFixed(1)}, ${player.y.toFixed(1)}) with color 0x${player.color.toString(16)}`);
    console.log(`📊 Total players in room: ${this.state.players.size}`);
    
    // Check for winner (only 1 player left alive)
    this.checkForWinner();
  }

  /**
   * Check if there's a winner (only 1 player alive)
   */
  private checkForWinner() {
    const alivePlayers = Array.from(this.state.players.values()).filter(p => p.hp > 0);
    
    if (alivePlayers.length === 1 && this.state.players.size > 1) {
      const winner = alivePlayers[0];
      console.log(`🏆 ${winner.name} wins!`);
      this.broadcast("winner", {
        id: winner.id,
        name: winner.name,
        committee: winner.committee,
      });
    }
  }

  /**
   * onLeave
   * Called when a player disconnects.
   * Removes the player from the game state.
   */
  onLeave(client: Client) {
    const player = this.state.players.get(client.sessionId);
    if (player) {
      console.log(`👋 ${player.name} left the game`);
    }
    this.state.players.delete(client.sessionId);
    this.lastAttackTime.delete(client.sessionId); // Clean up attack cooldown tracking
    
    // Check for winner after player leaves
    this.checkForWinner();
  }
}


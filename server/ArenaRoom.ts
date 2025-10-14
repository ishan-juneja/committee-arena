import { Room, Client } from "colyseus";
import { ArenaState } from "./schema/ArenaState";
import { PlayerState } from "./schema/PlayerState";

// Constants for game mechanics
const PUNCH_RADIUS = 50;
const ATTACK_DURATION_MS = 300;
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
      if (!player) return;
      
      // Update player position based on movement vector
      player.x += data.dx;
      player.y += data.dy;
      
      // Keep player within bounds
      player.x = Math.max(0, Math.min(800, player.x));
      player.y = Math.max(0, Math.min(600, player.y));
    });

    // Handle attack messages
    // When a player attacks, check if any other players are in range
    this.onMessage("attack", (client) => {
      const attacker = this.state.players.get(client.sessionId);
      if (!attacker || attacker.hp <= 0) return;

      // Set attacking flag (useful for animations on client)
      attacker.attacking = true;
      
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
          }
        }
      }
      
      // Reset attacking flag after animation duration
      setTimeout(() => {
        if (attacker) attacker.attacking = false;
      }, ATTACK_DURATION_MS);
    });
  }

  /**
   * onJoin
   * Called when a new player connects.
   * Creates a new PlayerState and adds it to the game.
   */
  onJoin(client: Client, options: any) {
    const player = new PlayerState();
    player.id = client.sessionId;
    player.name = options.name || "Guest";
    player.committee = options.committee || "Coffee Chats";
    
    // Spawn player at random position
    player.x = Math.random() * (SPAWN_X_MAX - SPAWN_X_MIN) + SPAWN_X_MIN;
    player.y = Math.random() * (SPAWN_Y_MAX - SPAWN_Y_MIN) + SPAWN_Y_MIN;
    player.hp = 3;
    
    // Add player to game state
    this.state.players.set(client.sessionId, player);
    
    console.log(`✅ ${player.name} joined as ${player.committee}`);
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
  }
}


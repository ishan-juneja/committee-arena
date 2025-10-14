"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArenaRoom = void 0;
const colyseus_1 = require("colyseus");
const ArenaState_1 = require("./schema/ArenaState");
const PlayerState_1 = require("./schema/PlayerState");
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
class ArenaRoom extends colyseus_1.Room {
    constructor() {
        super(...arguments);
        // Track last attack time for each player (prevents spam)
        this.lastAttackTime = new Map();
        // Track if winner has been announced to prevent multiple broadcasts
        this.winnerAnnounced = false;
        // Track active timers for cleanup
        this.activeTimers = new Map();
    }
    /**
     * onCreate
     * Called when the room is created.
     * Sets up the initial game state and message handlers.
     */
    onCreate() {
        this.setState(new ArenaState_1.ArenaState());
        // Set maximum number of clients
        this.maxClients = 12;
        // Handle player movement messages
        // Clients send { dx, dy } to move their character
        this.onMessage("move", (client, data) => {
            const player = this.state.players.get(client.sessionId);
            if (!player) {
                console.log(`⚠️ Move message from unknown player: ${client.sessionId}`);
                return;
            }
            // Prevent dead players from moving
            if (player.hp <= 0)
                return;
            // Only process if there's actual movement
            if (data.dx === 0 && data.dy === 0)
                return;
            // Update player position based on movement vector
            player.x += data.dx;
            player.y += data.dy;
            // Keep player within bounds
            player.x = Math.max(0, Math.min(800, player.x));
            player.y = Math.max(0, Math.min(600, player.y));
            // Removed excessive movement logging to keep console clean
        });
        // Handle attack messages
        // When a player attacks, check if any other players are in range
        this.onMessage("attack", (client) => {
            const attacker = this.state.players.get(client.sessionId);
            if (!attacker || attacker.hp <= 0)
                return;
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
            console.log(`👊 ${attacker.name} is attacking at (${attacker.x.toFixed(0)}, ${attacker.y.toFixed(0)})`);
            // Check all other players for hits
            for (const [targetId, target] of this.state.players.entries()) {
                // Don't hit yourself
                if (targetId === client.sessionId)
                    continue;
                // Skip dead players
                if (target.hp <= 0)
                    continue;
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
            // Clear any existing timer for this player
            const existingTimer = this.activeTimers.get(client.sessionId);
            if (existingTimer) {
                clearTimeout(existingTimer);
            }
            const timer = setTimeout(() => {
                const player = this.state.players.get(client.sessionId);
                if (player) {
                    player.attacking = false;
                }
                this.activeTimers.delete(client.sessionId);
            }, ATTACK_DURATION_MS);
            this.activeTimers.set(client.sessionId, timer);
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
            // Reset winner flag so a new winner can be announced
            this.winnerAnnounced = false;
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
    getSpawnPosition(playerIndex) {
        // Spawn positions in a circle around the center
        const centerX = 400;
        const centerY = 300;
        // For players 1-12, use inner circle
        // For players 13+, use outer circle with offset
        let radius = 120;
        let actualIndex = playerIndex;
        if (playerIndex >= 12) {
            // Outer circle for players beyond 12
            radius = 180;
            actualIndex = playerIndex - 12;
        }
        const angle = (actualIndex / 12) * Math.PI * 2; // Divide circle into 12 sections
        return {
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius
        };
    }
    onJoin(client, options) {
        const player = new PlayerState_1.PlayerState();
        player.id = client.sessionId;
        // Validate and sanitize player name on server side
        let name = options.name || "Guest";
        name = name.trim();
        // Enforce length limits
        if (name.length > 20) {
            name = name.substring(0, 20);
        }
        if (name.length < 2) {
            name = "Guest";
        }
        // Remove any potentially dangerous characters
        name = name.replace(/[^a-zA-Z0-9 \-_]/g, "");
        player.name = name;
        player.committee = options.committee || "Leadership Events Directors";
        // Assign color - ensure uniqueness by checking existing players
        const requestedColor = options.color || 0xffffff;
        const usedColors = Array.from(this.state.players.values()).map(p => p.color);
        // Available colors
        const availableColors = [
            0xFF6B6B, 0x4ECDC4, 0xFFD93D, 0x95E1D3,
            0xF38181, 0xAA96DA, 0xFCACA6, 0x6BCF7F,
            0x4A90E2, 0xE74C3C, 0x9B59B6, 0x3498DB
        ];
        // If requested color is available, use it; otherwise assign first unused color
        if (!usedColors.includes(requestedColor)) {
            player.color = requestedColor;
        }
        else {
            // Find first unused color
            const unusedColor = availableColors.find(c => !usedColors.includes(c));
            player.color = unusedColor || requestedColor; // Fallback to requested if all taken
        }
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
    checkForWinner() {
        // Don't check if winner already announced
        if (this.winnerAnnounced)
            return;
        const alivePlayers = Array.from(this.state.players.values()).filter(p => p.hp > 0);
        if (alivePlayers.length === 1 && this.state.players.size > 1) {
            const winner = alivePlayers[0];
            console.log(`🏆 ${winner.name} wins!`);
            this.broadcast("winner", {
                id: winner.id,
                name: winner.name,
                committee: winner.committee,
            });
            this.winnerAnnounced = true;
        }
    }
    /**
     * onLeave
     * Called when a player disconnects.
     * Removes the player from the game state.
     */
    async onLeave(client, consented) {
        const player = this.state.players.get(client.sessionId);
        if (player) {
            console.log(`👋 ${player.name} disconnected`);
            // Allow reconnection within allowReconnection time
            try {
                if (!consented) {
                    console.log(`⏳ Allowing ${player.name} to reconnect for 60 seconds...`);
                    await this.allowReconnection(client, 60);
                    console.log(`✅ ${player.name} reconnected!`);
                    return; // Player reconnected, don't remove them
                }
            }
            catch (e) {
                console.log(`❌ ${player.name} did not reconnect in time`);
            }
            // Player didn't reconnect, remove them
            console.log(`🗑️ Removing ${player.name} from game`);
        }
        this.state.players.delete(client.sessionId);
        this.lastAttackTime.delete(client.sessionId);
        // Clean up any active timers for this player
        const timer = this.activeTimers.get(client.sessionId);
        if (timer) {
            clearTimeout(timer);
            this.activeTimers.delete(client.sessionId);
        }
        // Check for winner after player leaves
        this.checkForWinner();
    }
}
exports.ArenaRoom = ArenaRoom;

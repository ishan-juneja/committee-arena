/**
 * Network
 * Handles all communication with the Colyseus server.
 * Provides a clean interface for joining rooms and sending messages.
 */

export default class Network {
  /**
   * Creates a new Network instance
   * Connects to the Colyseus server (defaults to same host as web page)
   */
  constructor() {
    // Check if Colyseus is loaded
    if (typeof window.Colyseus === 'undefined') {
      console.error('❌ Colyseus library not loaded!');
      throw new Error('Colyseus library not loaded. Please check your internet connection.');
    }
    
    // Determine server URL based on current location
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname;
    
    // For production (Vercel/Render), use the same host without port
    // For local development, use port 2567
    let serverUrl;
    if (host === "localhost" || host === "127.0.0.1") {
      serverUrl = `${protocol}//${host}:2567`;
    } else {
      serverUrl = `${protocol}//${host}`;
    }
    
    console.log(`🌐 Connecting to server: ${serverUrl}`);
    
    // Create Colyseus client using the global Colyseus object
    this.client = new window.Colyseus.Client(serverUrl);
    this.room = null;
  }

  /**
   * Joins or creates an arena room
   * @param {string} name - Player's display name
   * @param {string} committee - Player's committee affiliation
   * @param {number} color - Player's color (hex number)
   * @param {string} reconnectionToken - Optional token for reconnection
   * @returns {Promise<Room>} The joined room instance
   */
  async join(name, committee, color, reconnectionToken = null) {
    try {
      // Try to reconnect first if we have a token
      if (reconnectionToken) {
        try {
          console.log(`🔄 Attempting to reconnect with saved token...`);
          this.room = await this.client.reconnect(reconnectionToken);
          console.log(`✅ Reconnected successfully! Maintaining your state.`);
          return this.room;
        } catch (reconnectError) {
          console.log(`⚠️ Reconnection failed, joining as new player...`);
          // Fall through to normal join
        }
      }
      
      // Normal join/create
      this.room = await this.client.joinOrCreate("arena", { 
        name, 
        committee,
        color
      });
      
      // Save reconnection token for future refreshes
      if (this.room.reconnectionToken) {
        localStorage.setItem('arenaReconnectToken', this.room.reconnectionToken);
        console.log(`💾 Saved reconnection token for future refreshes`);
      }
      
      console.log(`✅ Joined arena as ${name} (${committee}) with color 0x${color.toString(16)}`);
      return this.room;
    } catch (error) {
      console.error("❌ Failed to join room:", error);
      throw error;
    }
  }

  /**
   * Sends a movement update to the server
   * @param {{x: number, y: number}} vec - Movement vector
   */
  sendMove(vec) {
    if (!this.room) return;
    
    // Only send if there's actual movement
    if (vec.x !== 0 || vec.y !== 0) {
      const movement = { 
        dx: vec.x * 3, // Movement speed multiplier
        dy: vec.y * 3 
      };
      // Only log occasionally to avoid flooding console
      this.room.send("move", movement);
    }
  }

  /**
   * Sends an attack action to the server
   */
  sendAttack() {
    if (!this.room) return;
    
    this.room.send("attack");
    console.log("👊 Attack!");
  }

  /**
   * Sends a reset game action to the server
   */
  sendReset() {
    if (this.room) {
      this.room.send("reset");
      console.log("🔄 Reset requested");
    }
  }

  /**
   * Disconnects from the room
   */
  disconnect() {
    if (this.room) {
      this.room.leave();
      console.log("👋 Disconnected from room");
    }
  }
}


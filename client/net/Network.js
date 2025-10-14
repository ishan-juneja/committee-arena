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
    const port = window.location.port || "2567";
    const serverUrl = `${protocol}//${host}:${port}`;
    
    console.log(`🌐 Connecting to server: ${serverUrl}`);
    
    // Create Colyseus client using the global Colyseus object
    this.client = new window.Colyseus.Client(serverUrl);
    this.room = null;
  }

  /**
   * Joins or creates an arena room
   * @param {string} name - Player's display name
   * @param {string} committee - Player's committee affiliation
   * @returns {Promise<Room>} The joined room instance
   */
  async join(name, committee) {
    try {
      this.room = await this.client.joinOrCreate("arena", { 
        name, 
        committee 
      });
      
      console.log(`✅ Joined arena as ${name} (${committee})`);
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
      this.room.send("move", { 
        dx: vec.x * 3, // Movement speed multiplier
        dy: vec.y * 3 
      });
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
   * Disconnects from the room
   */
  disconnect() {
    if (this.room) {
      this.room.leave();
      console.log("👋 Disconnected from room");
    }
  }
}


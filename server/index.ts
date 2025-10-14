import express from "express";
import { Server } from "colyseus";
import { createServer } from "http";
import { ArenaRoom } from "./ArenaRoom";
import path from "path";

/**
 * Main server file
 * Bootstraps the Colyseus game server and serves static client files.
 */

const app = express();
const PORT = process.env.PORT || 2567;

// Serve static files from client directory
app.use(express.static(path.join(__dirname, "../client")));

// Create HTTP server
const httpServer = createServer(app);

// Create Colyseus game server
const gameServer = new Server({
  server: httpServer,
});

// Register the ArenaRoom
// Clients will connect to this room using "arena" as the room name
gameServer.define("arena", ArenaRoom);

// Start listening
httpServer.listen(PORT, () => {
  console.log("╔═══════════════════════════════════════╗");
  console.log("║   🎮 Committee Arena Server          ║");
  console.log("╚═══════════════════════════════════════╝");
  console.log(`✅ Colyseus running on ws://localhost:${PORT}`);
  console.log(`🌐 Client available at http://localhost:${PORT}`);
  console.log("");
  console.log("Ready for players to join!");
});


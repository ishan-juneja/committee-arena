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
// When compiled to dist/server/index.js, we need to go up two levels to reach client/
app.use(express.static(path.join(__dirname, "../../client")));

// Create HTTP server
const httpServer = createServer(app);

// Create Colyseus game server
const gameServer = new Server({
  server: httpServer,
});

// Register the ArenaRoom with a max capacity of 12 players
// Clients will connect to this room using "arena" as the room name
const roomDefinition = gameServer.define("arena", ArenaRoom);
// Note: maxClients is set within ArenaRoom.onCreate() for better control

// Start listening on 0.0.0.0 (required for Render/Railway deployment)
const HOST = process.env.HOST || "0.0.0.0";
httpServer.listen(Number(PORT), HOST, () => {
  console.log("╔═══════════════════════════════════════╗");
  console.log("║   🎮 Committee Arena Server          ║");
  console.log("╚═══════════════════════════════════════╝");
  console.log(`✅ Colyseus running on ${HOST}:${PORT}`);
  console.log(`🌐 Server ready for connections`);
  console.log("");
  console.log("Ready for players to join!");
});


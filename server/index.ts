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

// Serve static files from client directory (works in dev and prod)
const staticDir = path.join(process.cwd(), "client");
console.log(`📁 Serving static files from: ${staticDir}`);

app.use(express.static(staticDir));

// Root route -> serve index.html explicitly
app.get("/", (req, res) => {
  const indexPath = path.join(staticDir, "index.html");
  console.log(`📄 Serving index.html from: ${indexPath}`);
  res.sendFile(indexPath);
});

// Create HTTP server (after defining Express routes)
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


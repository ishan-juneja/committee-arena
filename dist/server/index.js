"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const colyseus_1 = require("colyseus");
const http_1 = require("http");
const ArenaRoom_1 = require("./ArenaRoom");
const path_1 = __importDefault(require("path"));
/**
 * Main server file
 * Bootstraps the Colyseus game server and serves static client files.
 */
const app = (0, express_1.default)();
const PORT = process.env.PORT || 2567;
// Serve static files from client directory (works in dev and prod)
const staticDir = path_1.default.join(process.cwd(), "client");
console.log(`📁 Serving static files from: ${staticDir}`);
app.use(express_1.default.static(staticDir));
// Root route -> serve index.html explicitly
app.get("/", (req, res) => {
    const indexPath = path_1.default.join(staticDir, "index.html");
    console.log(`📄 Serving index.html from: ${indexPath}`);
    res.sendFile(indexPath);
});
// Create HTTP server (after defining Express routes)
const httpServer = (0, http_1.createServer)(app);
// Create Colyseus game server
const gameServer = new colyseus_1.Server({
    server: httpServer,
});
// Register the ArenaRoom with a max capacity of 12 players
// Clients will connect to this room using "arena" as the room name
const roomDefinition = gameServer.define("arena", ArenaRoom_1.ArenaRoom);
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

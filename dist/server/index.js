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
// Serve static files from client directory
// When compiled to dist/server/index.js, we need to go up two levels to reach client/
app.use(express_1.default.static(path_1.default.join(__dirname, "../../client")));
// Create HTTP server
const httpServer = (0, http_1.createServer)(app);
// Create Colyseus game server
const gameServer = new colyseus_1.Server({
    server: httpServer,
});
// Register the ArenaRoom with a max capacity of 12 players
// Clients will connect to this room using "arena" as the room name
const roomDefinition = gameServer.define("arena", ArenaRoom_1.ArenaRoom);
// Note: maxClients is set within ArenaRoom.onCreate() for better control
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

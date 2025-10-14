import { Schema, type, MapSchema } from "@colyseus/schema";
import { PlayerState } from "./PlayerState";

/**
 * ArenaState
 * Main game state that holds all connected players.
 * This state is synchronized with all clients in real-time.
 */
export class ArenaState extends Schema {
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
}


import { Schema, type } from "@colyseus/schema";

/**
 * PlayerState
 * Represents a single player in the arena.
 * Tracks position, health, name, committee affiliation, and attack state.
 */
export class PlayerState extends Schema {
  @type("string") id: string = "";
  @type("string") name: string = "";
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") hp: number = 3;
  @type("string") committee: string = "";
  @type("boolean") attacking: boolean = false;
}


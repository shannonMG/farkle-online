import mongoose, { Schema, Document, Model } from "mongoose";

// Define an interface for a player within a game.
export interface IPlayer {
  userId: mongoose.Types.ObjectId;  // Reference to the user's ID in the users collection.
  username: string;                 // Display name for the player.
  totalScore: number;               // Accumulated score across rounds.
  turnScore: number;                // Score for the current turn.
  order: number;                    // Order in which the player takes their turn.
  isActive: boolean;                // Indicates if this player is currently active.
}

// Define an interface for the current turn details.
export interface ICurrentTurn {
  playerId: string;         // The player whose turn is in progress.
  rollCount: number;        // Number of rolls the player has made this turn.
  dice: number[];           // Array of dice values from the latest roll.
  selectedDice: number[];   // Dice the player has chosen to bank for scoring.
  turnScore: number; 
  diceRemaining: number;       // The score accumulated so far in this turn.
}

// Define an interface for each history entry (each move or action).
export interface IHistory {
  turnNumber: number;       // Sequential number for the turn or move.
  playerId: string;         // Which player made the move.
  action: string;           // Action taken, such as "roll", "bank", or "farkle".
  diceRolled: number[];     // The result of the dice roll.
  pointsEarned: number;     // Points earned from that action.
  timestamp: Date;          // When the action occurred.
}

// Define the main interface for the game document.
export interface IGame extends Document {
  gameId: string;           // Unique identifier for the game.
  createdAt: Date;          // Timestamp for game creation.
  updatedAt: Date;          // Timestamp for the most recent update.
  status: "waiting" | "inProgress" | "completed";  // Current game state.
  targetScore: number;    // The score needed to win.
  players: IPlayer[];       // List of players in the game.
  currentTurn?: ICurrentTurn | undefined; // Current turn details (optional if game hasn't started).
  history: IHistory[];      // Log of moves or events throughout the game.
}

// Define a schema for the player subdocument.
const PlayerSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  username: { type: String, required: true },
  totalScore: { type: Number, default: 0 },
  turnScore: { type: Number, default: 0 },
  order: { type: Number, required: true },
  isActive: { type: Boolean, default: false },
});

// Define a schema for the current turn.
const CurrentTurnSchema: Schema = new Schema({
  playerId: { type: String, required: true },
  rollCount: { type: Number, default: 0 },
  dice: { type: [Number], required: true },
  selectedDice: { type: [Number], default: [] },
  turnScore: { type: Number, default: 0 },
  diceRemaining: { type: Number, default: 6 }
});

// Define a schema for history entries.
const HistorySchema: Schema = new Schema({
  turnNumber: { type: Number, required: true },
  playerId: { type: String, required: true },
  action: { type: String, required: true },
  diceRolled: { type: [Number], required: true },
  pointsEarned: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
});

// Define the main game schema.
const GameSchema: Schema = new Schema({
  gameId: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ["waiting", "inProgress", "completed"], required: true },
  targetScore: { type: Number, required: true },
  players: { type: [PlayerSchema], default: [] },
  currentTurn: { type: CurrentTurnSchema, required: false },
  history: { type: [HistorySchema], default: [] },
});

// Pre-save hook to update the 'updatedAt' field automatically.
GameSchema.pre<IGame>("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Create and export the Mongoose model.
export const Game: Model<IGame> = mongoose.model<IGame>("Game", GameSchema);

import { Document, Types } from "mongoose";
import mongoose, { Schema, Model } from "mongoose";

export interface IGame extends Document {
  participants: Types.ObjectId[]; // Array of user IDs
  status: "waiting" | "in-progress" | "completed";
  turnIndex: number; // Tracks whose turn it is
  scores: Map<Types.ObjectId, number>; // Player scores
  roundScores: Map<Types.ObjectId, number>; // Round scores (reset per turn)
  currentDice: number[]; // Last rolled dice
  createdAt: Date;
  updatedAt: Date;
}

const gameSchema = new Schema<IGame>({
  participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
  status: { type: String, enum: ["waiting", "in-progress", "completed"], default: "waiting" },
  turnIndex: { type: Number, default: 0 },
  scores: { type: Map, of: Number },
  roundScores: { type: Map, of: Number },
  currentDice: [{ type: Number }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// ✅ Use Named Export
export const Game: Model<IGame> = mongoose.model<IGame>("Game", gameSchema);

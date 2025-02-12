import mongoose, { Schema, Document, Model } from "mongoose";

// Define an interface for the invitation document.
export interface IInvitation extends Document {
  gameId: mongoose.Types.ObjectId;      // Reference to the associated game.
  inviterId: mongoose.Types.ObjectId;   // Reference to the user who is sending the invitation.
  inviteeId: mongoose.Types.ObjectId;   // Reference to the user who is being invited.
  status: "pending" | "accepted" | "declined";  // Current status of the invitation.
  createdAt: Date;                      // Timestamp when the invitation was created.
  updatedAt: Date;                      // Timestamp when the invitation was last updated.
}

// Define the Invitation schema.
const InvitationSchema: Schema = new Schema({
  gameId: { type: Schema.Types.ObjectId, ref: "Game", required: true },
  inviterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  inviteeId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["pending", "accepted", "declined"], default: "pending", required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Pre-save hook to update the 'updatedAt' field automatically.
InvitationSchema.pre<IInvitation>("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Create and export the Mongoose model.
export const Invitation: Model<IInvitation> = mongoose.model<IInvitation>("Invitation", InvitationSchema);

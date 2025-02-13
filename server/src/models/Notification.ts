import mongoose, { Schema, Document, Model } from "mongoose";

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;  // User receiving the notification
  type: "invite" | "game_update" | "turn_alert" | "inviteAccepted" | "inviteDeclined"; // Type of notification
  message: string;  // The notification text
  isRead: boolean;   // Has the user seen this?
  createdAt: Date;   // Timestamp
}

// Define the schema
const NotificationSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["invite", "game_update", "turn_alert", "inviteAccepted", "inviteDeclined"], required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// Create model
export const Notification: Model<INotification> = mongoose.model<INotification>("Notification", NotificationSchema);

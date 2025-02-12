import mongoose, { Schema, Document, Model } from "mongoose";

// Define an interface for the Notification document.
// This provides type checking at compile time.
export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;       // The recipient of the notification.
  type: string;                          // The category/type of notification (e.g., "invitation", "gameUpdate").
  message: string;                       // The content or message of the notification.
  isRead: boolean;                       // Flag to indicate if the notification has been read.
  relatedEntity?: mongoose.Types.ObjectId; // Optional reference to a related document (e.g., a Game or Invitation).
  createdAt: Date;                       // Timestamp when the notification was created.
  updatedAt: Date;                       // Timestamp when the notification was last updated.
}

// Define the Mongoose schema for notifications.
const NotificationSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  // If you want to relate this notification to another entity, like a Game or Invitation,
  // you can use refPath to dynamically reference different collections if needed.
  relatedEntity: { type: Schema.Types.ObjectId, ref: "AnyModel", required: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Pre-save hook to update the updatedAt field automatically before saving.
NotificationSchema.pre<INotification>("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Create and export the Notification model.
export const Notification: Model<INotification> = mongoose.model<INotification>("Notification", NotificationSchema);

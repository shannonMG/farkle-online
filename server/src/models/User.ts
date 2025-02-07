import mongoose, { Document, Schema, Types } from "mongoose";
import bcrypt from "bcryptjs";

// Define the User interface for TypeScript
export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  email: string;
  password: string;
  role: string;
  isCorrectPassword(password: string): Promise<boolean>;
}

// Create the schema
const userSchema: Schema<IUser> = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "user" },
});

// Hash password before saving
userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Define isCorrectPassword method
userSchema.methods.isCorrectPassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

// Export the User model
export const User = mongoose.model<IUser>("User", userSchema);

import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "./src/models/User.js"
import { Game } from "./src/models/Game.js"
import { Invitation } from "./src/models/Invitation.js"
import { Notification } from "./src/models/Notification.js"
import bcrypt from "bcryptjs"

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/Farkle-Online";

const seedDatabase = async () => {
  try {
    console.log("🌱 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);

    console.log("🧹 Clearing existing data...");
    await User.deleteMany({});
    await Game.deleteMany({});
    await Invitation.deleteMany({});
    await Notification.deleteMany({});

    console.log("🔐 Hashing passwords for users...");
    const hashedPasswords = await Promise.all([
      bcrypt.hash("password123", 10),
      bcrypt.hash("password123", 10),
      bcrypt.hash("password123", 10),
    ]);

    console.log("👥 Seeding users...");
    const users = await User.insertMany([
      { username: "player1", email: "player1@example.com", password: hashedPasswords[0] },
      { username: "player2", email: "player2@example.com", password: hashedPasswords[1] },
      { username: "player3", email: "player3@example.com", password: hashedPasswords[2] },
    ]);

    console.log("🎲 Seeding games...");
    const games = await Game.insertMany([
      {
        gameId: new mongoose.Types.ObjectId(),
        status: "waiting",
        targetScore: 10000,
        players: [{ userId: users[0]._id, username: users[0].username, order: 1 }],
      },
      {
        gameId: new mongoose.Types.ObjectId(),
        status: "inProgress",
        targetScore: 10000,
        players: [
          { userId: users[1]._id, username: users[1].username, order: 1 },
          { userId: users[2]._id, username: users[2].username, order: 2 },
        ],
      },
    ]);

    console.log("📨 Seeding invitations...");
    await Invitation.insertMany([
      {
        gameId: games[0]._id,
        inviterId: users[0]._id,
        inviteeId: users[1]._id,
        status: "pending",
      },
    ]);

    console.log("🔔 Seeding notifications...");
    await Notification.insertMany([
      {
        userId: users[1]._id,
        type: "invite",
        message: `${users[0].username} invited you to a game!`,
      },
    ]);

    console.log("✅ Seeding complete!");
    mongoose.connection.close();
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    mongoose.connection.close();
  }
};

seedDatabase();
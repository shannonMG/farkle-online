import bcrypt from 'bcrypt';
import { User } from './../models/User.js';
import { AuthenticationError } from "apollo-server-express";
import dotenv from "dotenv";
import { signToken } from '../utils/auth.js';
dotenv.config();
const resolvers = {
    Query: {
        users: async () => { await User.find(); },
        me: async (_parent, _args, context) => {
            if (context.user) {
                return await User.findOne({ _id: context.user._id });
            }
            throw new AuthenticationError('You must be logged in to access this data.');
        },
    },
    Mutation: {
        register: async (_, { username, email, password }) => {
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = new User({ username, email, password: hashedPassword });
            return await newUser.save();
        },
        login: async (_parent, { username, password }) => {
            console.log("🔍 Checking user:", username);
            // 1. Find user by username
            const user = await User.findOne({ username });
            // 2. If no user is found, throw an AuthenticationError
            if (!user) {
                console.error("❌ User not found!");
                throw new AuthenticationError("Could not authenticate user.");
            }
            // 3. Check if the password is correct using `isCorrectPassword`
            const correctPw = await user.isCorrectPassword(password);
            if (!correctPw) {
                console.error("❌ Incorrect password!");
                throw new AuthenticationError("Could not authenticate user.");
            }
            // 4. Sign a JWT token with user details
            const token = signToken(user.username, user._id.toString(), user.role);
            console.log("✅ Login successful!");
            // 5. Return the token and user
            return { token, user };
        },
        logout: async (_, __, context) => {
            try {
                if (!context.res) {
                    throw new Error("Response object is not available in context");
                }
                // Clear the JWT token from cookies
                context.res.clearCookie("token", {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: "Strict",
                });
                return true;
            }
            catch (error) {
                console.error("Logout error:", error);
                return false;
            }
        },
    },
};
export default resolvers;

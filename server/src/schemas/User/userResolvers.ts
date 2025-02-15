import bcrypt from 'bcrypt';
import { User } from '../../models/User.js';
import { AuthenticationError } from "apollo-server-express";
import dotenv from "dotenv";
import { signToken } from '../../utils/auth.js';
import { Types } from 'mongoose';
import { GraphQLError } from "graphql";
import { IUser } from "../../models/User.js";

// Load environment variables from the .env file into process.env
dotenv.config();

// Retrieve the JWT secret key from environment variables
const SECRET_KEY = process.env.JWT_SECRET_KEY;

// If the secret key is not defined, throw an error to prevent the app from running
if (!SECRET_KEY) {
  throw new Error("SECRET_KEY is not defined in the environment variables");
}

// Define a plain TypeScript interface for a user.
// This interface is used for lightweight objects (e.g., for context or DTOs) and is not tied to Mongoose methods.
interface User {
  _id: Types.ObjectId;
  username: string;
  email: string;
  password: string;
  role: string;
}

// Define the shape of the GraphQL context object.
// The context may optionally contain a user property (if the request is authenticated).
interface Context {
  user?: User;
}

// Define the GraphQL resolvers for user-related queries and mutations.
const userResolvers = {
  Query: {
    // Resolver to fetch all users from the database.
    // Returns a promise that resolves to an array of IUser (Mongoose documents).
    users: async (): Promise<IUser[]> => {
      try {
        // Retrieve all user documents from the database using the User model.
        const allUsers = await User.find();
        console.log("✅ Retrieved users:", allUsers); // Log the retrieved users for debugging.
        return allUsers; // Return the array of users.
      } catch (error) {
        console.error("❌ Error fetching users:", error); // Log any error encountered during retrieval.
        // Throw a GraphQL error that will be sent to the client.
        throw new GraphQLError("Failed to fetch users.");
      }
    },
    
    // Resolver to fetch the currently authenticated user's data.
    // Expects a context object that contains the authenticated user.
    me: async (_parent: any, _args: any, context: Context): Promise<User | null> => {
      // If a user is present in the context (i.e., the user is authenticated)
      if (context.user) {
        // Find and return the user document in the database by matching the user's _id from the context.
        return await User.findOne({ _id: context.user._id });
      }
      // If no user is in the context, throw an AuthenticationError indicating that login is required.
      throw new AuthenticationError('You must be logged in to access this data.');
    },
  },

  Mutation: {
    // Resolver for registering a new user.
    // It takes username, email, and password as arguments and returns an object with a JWT token and the new user.
    register: async (
      _parent: any,
      { username, email, password }: { username: string; email: string; password: string }
    ): Promise<{ token: string; user: IUser }> => {
      try {
        console.log("🚀 Registering user:", username); // Log the registration attempt with the username.

        // Check if a user with the provided username or email already exists in the database.
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
          // If a duplicate user is found, throw an error indicating that the username or email is already in use.
          throw new GraphQLError("Username or email already in use.");
        }

        // Create a new user instance.
        // NOTE: The password is provided as plain text; the User model's middleware will automatically hash it.
        const newUser = new User({
          username,
          email,
          password, // Save password as provided; it will be hashed before saving.
        });

        // Save the new user document to the database.
        const savedUser = await newUser.save();

        // Generate a JWT token for the newly registered user.
        // The token is generated using the username, user _id (converted to string), and password hash.
        const token = signToken(savedUser.username, savedUser._id.toString(), savedUser.password);

        console.log("✅ Registration successful!"); // Log that registration was successful.
        // Return the token and the saved user document to the client.
        return { token, user: savedUser };
      } catch (error) {
        console.error("❌ Error registering user:", error); // Log any error encountered during registration.
        // Throw a GraphQL error to notify the client that registration failed.
        throw new GraphQLError("Registration failed.");
      }
    },

    // Resolver for logging in a user.
    // Accepts username and password, and returns an object with a JWT token and the user document.
    login: async (
      _parent: any,
      { username, password }: { username: string; password: string }
    ): Promise<{ token: string; user: IUser }> => {
      console.log("🔍 Checking user:", username); // Log the login attempt with the username.

      // 1. Attempt to find a user document with the provided username.
      const user = await User.findOne({ username });
      if (!user) {
        console.error("❌ User not found!"); // Log if the user is not found.
        // Throw a GraphQL error indicating authentication failure.
        throw new GraphQLError("Could not authenticate user.", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      // 2. Log the stored hashed password for debugging purposes.
      console.log("🛠️ Stored Hashed Password:", user.password);

      // 3. Use bcrypt to compare the provided password with the stored hashed password.
      const correctPw = await bcrypt.compare(password, user.password);
      console.log("🛠️ Password Match:", correctPw); // Log the result of the password comparison.

      // If the password comparison fails, throw an error indicating incorrect credentials.
      if (!correctPw) {
        console.error("❌ Incorrect password!");
        throw new GraphQLError("Could not authenticate user.", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      // 4. If the password is correct, generate a JWT token for the user.
      const token = signToken(user.username, user._id.toString(), user.password);

      console.log("✅ Login successful!"); // Log that the login was successful.
      // Return the token and the user document to the client.
      return { token, user };
    },
    logout: async (_parent: any, _args: any, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError("You must be logged in to logout.");
      }
      console.log("🔒 User logged out:", context.user.username);
      return { message: "Logout successful" };
    },
  },
};

// Export the userResolvers object as the default export of this module
export default userResolvers;

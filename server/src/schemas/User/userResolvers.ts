import bcrypt from 'bcrypt';
import { User } from '../../models/User.js';
import { AuthenticationError } from "apollo-server-express";
import dotenv from "dotenv";
import { signToken } from '../../utils/auth.js'
import {Types} from 'mongoose'
import {GraphQLError} from "graphql"

import {IUser} from "../../models/User.js"

dotenv.config();
const SECRET_KEY = process.env.JWT_SECRET_KEY;

if (!SECRET_KEY) {
  throw new Error("SECRET_KEY is not defined in the environment variables");
}

interface User {
  _id: Types.ObjectId;
  username: string;
  email: string;
  password: string;
  role: string;
}
interface Context {
  user?: User;
}

const userResolvers = {
    Query: {
      users: async (): Promise<IUser[]> => {
        try {
          const allUsers = await User.find();
          console.log("✅ Retrieved users:", allUsers);
          return allUsers;
        } catch (error) {
          console.error("❌ Error fetching users:", error);
          throw new GraphQLError("Failed to fetch users.");
        }
      },
      
        me: async (_parent: any, _args: any, context: Context): Promise<User | null> => {
          if (context.user) {
            return await User.findOne({ _id: context.user._id });
          }
          throw new AuthenticationError('You must be logged in to access this data.');
    
        },
    },
    Mutation: {
      register: async (_parent: any, { username, email, password }: 
        { username: string; email: string; password: string }): Promise<{ token: string; user: IUser }> => {
        try {
          console.log("🚀 Registering user:", username);
  
          // Check if user exists
          const existingUser = await User.findOne({ $or: [{ username }, { email }] });
          if (existingUser) {
            throw new GraphQLError("Username or email already in use.");
          }
  
          // ✅ NO manual password hashing here! The User model will hash it automatically.
          const newUser = new User({
            username,
            email,
            password, // 🚀 Save password as plain text, model will hash it.
          });
  
          const savedUser = await newUser.save();
  
          // Generate JWT
          const token = signToken(savedUser.username, savedUser._id.toString(), savedUser.password);
  
          console.log("✅ Registration successful!");
          return { token, user: savedUser };
        } catch (error) {
          console.error("❌ Error registering user:", error);
          throw new GraphQLError("Registration failed.");
        }
      },
  
      login: async (
        _parent: any,
        { username, password }: { username: string; password: string }
      ): Promise<{ token: string; user: IUser }> => {
        console.log("🔍 Checking user:", username);
  
        // 1. Find user by username
        const user = await User.findOne({ username });
        if (!user) {
          console.error("❌ User not found!");
          throw new GraphQLError("Could not authenticate user.", {
            extensions: { code: "UNAUTHENTICATED" },
          });
        }
  
        // 2. Debug: Check stored password hash
        console.log("🛠️ Stored Hashed Password:", user.password);
  
        // 3. Check if password matches the hashed password
        const correctPw = await bcrypt.compare(password, user.password);
        console.log("🛠️ Password Match:", correctPw);
  
        if (!correctPw) {
          console.error("❌ Incorrect password!");
          throw new GraphQLError("Could not authenticate user.", {
            extensions: { code: "UNAUTHENTICATED" },
          });
        }
  
        // 4. Generate JWT token
        const token = signToken(user.username, user._id.toString(), user.password);
  
        console.log("✅ Login successful!");
        return { token, user };
      },
    },
}
    
     
    

export default userResolvers;

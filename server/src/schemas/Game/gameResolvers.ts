
import {IUser} from "../../models/User";
import {User} from "../../models/User.js";
import { IGame } from "../../models/Game";
import {Game} from "../../models/Game.js";

const gameResolvers = {
  Mutation: {
    addGame: async (_: any, { playerUsernames }: { playerUsernames: string[] }) => {
      try {
        // Fetch user _id's based on their usernames
        const users: IUser[] = await User.find({ username: { $in: playerUsernames } });

        // Ensure all usernames were found
        if (users.length !== playerUsernames.length) {
          throw new Error("One or more users not found.");
        }

        // Extract user IDs
        const participantIds = users.map(user => user._id);

        // Create a new game with these users
        const newGame: IGame = new Game({
          participants: participantIds,
          status: "waiting",
          turnIndex: 0,
          scores: new Map(participantIds.map(id => [id, 0])), // Initialize scores
          roundScores: new Map(participantIds.map(id => [id, 0])), // Initialize round scores
          currentDice: []
        });

        // Save the game to the database
        await newGame.save();
        // ✅ Populate `participants` before returning the game
        
        const populatedGame = await Game.findById(newGame._id).populate("participants");
        
        return populatedGame;
      } catch (error) {
        console.error("Error creating game:", error);
        throw new Error("Failed to create game.");
      }
    }
  }
};

export default gameResolvers;

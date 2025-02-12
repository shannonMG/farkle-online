// Import the Mongoose Game model
import { Game } from '../../models/Game.js';
import { GraphQLError } from 'graphql';
import { IPlayer } from '../../models/Game.js';
import { AuthenticationError } from 'apollo-server-errors';
import { Invitation } from '../../models/Invitation.js';
import { rollDice, evaluateRoll } from '../../utils/farkleUtils.js'

interface Context {
    user?: {
      _id: any;        // Typically a Mongoose ObjectId
      username: string;
      // Other fields if needed...
    };
  }

const gameResolvers = {
  Query: {
    // Resolver to fetch a single game by its gameId.
    game: async (_parent: any, args: { gameId: string }, _context: any) => {
      const { gameId } = args;
      try {
        // Find the game in the database by its gameId field.
        const gameData = await Game.findOne({ gameId });
        if (!gameData) {
          // If no game is found, throw an error that can be sent back to the client.
          throw new GraphQLError("Game not found.");
        }
        return gameData; // Return the game document. Mongoose documents can be returned as plain JSON.
      } catch (error) {
        console.error("Error fetching game:", error);
        throw new GraphQLError("Failed to fetch game.");
      }
    },

    // Resolver to fetch multiple games, potentially filtered by status.
    games: async (_parent: any, args: { status?: string }, _context: any) => {
      const { status } = args;
      try {
        // If a status is provided, filter games by that status.
        const query = status ? { status } : {};
        const gamesList = await Game.find(query);
        return gamesList;
      } catch (error) {
        console.error("Error fetching games:", error);
        throw new GraphQLError("Failed to fetch games.");
      }
    },
  },

  Mutation: {
    // Mutation resolver for creating a new game.
    createGame: async (_parent: any, args: { input: { gameId?: string; targetScore: number } }, _context: any) => {
      try {
        // Destructure input values from the args.
        const { gameId, targetScore } = args.input;
        
        // Create a new game instance.
        // Setting default values: status to "waiting", empty arrays for players and history.
        // currentTurn is left undefined since the game hasn't started.
        const newGame = new Game({
          gameId: gameId || `game_${new Date().getTime()}`, // Generate a gameId if none is provided.
          targetScore,
          status: "waiting",       // The game starts in the "waiting" state.
          players: [],             // No players have joined yet.
          history: []              // No actions recorded yet.
          // createdAt and updatedAt are handled by default values and the pre-save hook.
        });
        
        // Save the new game document to the database.
        const savedGame = await newGame.save();
        
        // Return the saved game to the client.
        return savedGame;
      } catch (error) {
        // Log the error and throw a GraphQL error so that the client gets a meaningful message.
        console.error("Error creating game:", error);
        throw new GraphQLError("Failed to create game.");
      }
    },

    joinGame: async (
        _parent: any,
        args: { input: { gameId: string } },
        context: Context
      ) => {
        // Ensure the user is authenticated.
        if (!context.user) {
          throw new AuthenticationError("You must be logged in to join a game.");
        }
  
        const { gameId } = args.input;
  
        try {
          // Find the game by its gameId field.
          const game = await Game.findOne({ gameId });
          if (!game) {
            throw new GraphQLError("Game not found.");
          }
  
          // Check if the game is joinable.
          // For example, the game must be in the "waiting" state.
          if (game.status !== "waiting") {
            throw new GraphQLError("Game is not joinable.");
          }
  
          // Check if the user is already a participant in the game.
          const isAlreadyJoined = game.players.some(
            (player: IPlayer) =>
              player.userId.toString() === context.user!._id.toString()
          );
          if (isAlreadyJoined) {
            throw new GraphQLError("You have already joined this game.");
          }
  
          // Determine the player's order. For instance, if there are already N players,
          // the new player's order is N+1.
          const newOrder = game.players.length + 1;
  
          // Create a new player object.
          const newPlayer: IPlayer = {
            userId: context.user._id,
            username: context.user.username,
            totalScore: 0,     // Initial total score.
            turnScore: 0,      // Initial turn score.
            order: newOrder,
            isActive: false,   // Not active until the game starts.
          };
  
          // Add the new player to the game's players array.
          game.players.push(newPlayer);
  
          // Save the updated game document to the database.
          const updatedGame = await game.save();
  
          // Return the updated game.
          return updatedGame;
        } catch (error) {
          console.error("Error joining game:", error);
          throw new GraphQLError("Failed to join game.");
        }
        
  // You can add Mutation resolvers here later as you build out game functionality.
    },

    startGame: async (_parent: any, args: { gameId: string }, _context: any) => {
        const { gameId } = args;
        try {
          // 1. Look up the game in the database using its gameId.
          const game = await Game.findOne({ gameId });
          if (!game) {
            throw new GraphQLError("Game not found.");
          }
  
          // 2. Validate that all invited players have responded.
          //    This query finds any invitations related to this game that are still pending.
          const pendingInvitations = await Invitation.find({
            gameId: game._id, // Adjust if your Invitation model uses a different field type
            status: "pending",
          });
          if (pendingInvitations.length > 0) {
            // If there are pending invitations, do not allow the game to start.
            throw new GraphQLError("Not all invited players have responded to the invitation.");
          }
  
          // 3. Check that the game is currently in a "waiting" state.
          if (game.status !== "waiting") {
            throw new GraphQLError("Game has already started or is completed.");
          }
  
          // 4. Ensure that there is at least one player in the game.
          if (game.players.length === 0) {
            throw new GraphQLError("No players in the game to start.");
          }
  
          // 5. Transition the game to the "inProgress" state.
          game.status = "inProgress";
  
          // 6. Initialize the current turn using the first player's details.
          //    We assume the first player in the players array is the one to start.
          game.currentTurn = {
            playerId: game.players[0].userId.toString(), // Convert ObjectId to string.
            rollCount: 0,      // No rolls have been made yet.
            dice: [],          // Dice will be rolled later.
            selectedDice: [],  // No dice have been selected yet.
            turnScore: 0, 
            diceRemaining: 0,     // Start with a turn score of 0.
          };
  
          // 7. Save the updated game document in the database.
          const updatedGame = await game.save();
  
          // Return the updated game to the client.
          return updatedGame;
        } catch (error) {
          console.error("Error starting game:", error);
          throw new GraphQLError("Failed to start game.");
        }
    },
    
    rollDice: async (_parent: any, args: { gameId: string }, _context: any) => {
      try {
        // Ensure the user is authenticated.
        if (!_context.user) {
          throw new AuthenticationError("You must be logged in to roll the dice.");
        }
        // Retrieve the game document.
        const game = await Game.findOne({ gameId: args.gameId });
        if (!game) {
          throw new GraphQLError("Game not found.");
        }
        if (game.status !== "inProgress") {
          throw new GraphQLError("Game is not in progress.");
        }
        if (!game.currentTurn) {
          throw new GraphQLError("No current turn is set.");
        }
        
        // Log current turn details.
        console.log("Current turn before roll:", game.currentTurn);
        
        // Determine number of dice to roll.
        const numDice = game.currentTurn.diceRemaining || 6;
        console.log("Rolling dice count:", numDice);
        
        // Roll the dice.
        const diceResults = rollDice(numDice);
        console.log("Dice results:", diceResults);
        
        // Evaluate the dice roll.
        const { rollScore, scoringDiceCount } = evaluateRoll(diceResults);
        console.log("Roll evaluation:", { rollScore, scoringDiceCount });
        
        // Update current turn.
        game.currentTurn.rollCount += 1;
        game.currentTurn.dice = diceResults;
        game.currentTurn.turnScore += rollScore;
        
        // Update remaining dice.
        let newDiceRemaining = numDice - scoringDiceCount;
        if (newDiceRemaining === 0) {
          newDiceRemaining = 6;
        }
        game.currentTurn.diceRemaining = newDiceRemaining;
        console.log("Updated current turn:", game.currentTurn);
        
        // Add a history entry.
        const newHistoryEntry = {
          turnNumber: game.history.length + 1,
          playerId: game.currentTurn.playerId,
          action: "roll",
          diceRolled: diceResults,
          pointsEarned: rollScore,
          timestamp: new Date(),
        };
        game.history.push(newHistoryEntry);
        console.log("New history entry added:", newHistoryEntry);
        
        // Save and return the updated game.
        const updatedGame = await game.save();
        return updatedGame;
      } catch (error) {
        console.error("Error in rollDice mutation:", error);
        throw new GraphQLError("Failed to roll dice.");
      }
    },

    
  },
}

export default gameResolvers;

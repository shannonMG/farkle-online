// Import the Mongoose Game model
import { Game } from '../../models/Game.js';
import { GraphQLError } from 'graphql';
import { IPlayer } from '../../models/Game.js';
import { AuthenticationError } from 'apollo-server-errors';
// import { Invitation } from '../../models/Invitation.js';
import { rollDice, evaluateRoll, endTurn } from '../../utils/farkleUtils.js'

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
    game: async (_parent: any, args: { gameId: string }) => {
      const game = await Game.findOne({ gameId: args.gameId });
      if (!game) {
        throw new GraphQLError("Game not found.");
      }
    
      // ✅ Ensure `currentTurn` and `rolls` are always defined
      if (!game.currentTurn) {
        game.currentTurn = {
          playerId: game.players[0].userId.toString(),
          rollCount: 0,
          dice: [],
          selectedDice: [],
          turnScore: 0,
          diceRemaining: 6,
          rolls: []
        };
      } else if (!game.currentTurn.rolls) {
        game.currentTurn.rolls = [];
      }
    
      return game;
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

    startGame: async (_parent: any, args: { gameId: string }) => {
      const game = await Game.findOne({ gameId: args.gameId });
      if (!game) {
        throw new GraphQLError("Game not found.");
      }
      if (game.status !== "waiting") {
        throw new GraphQLError("Game has already started.");
      }
    
      game.status = "inProgress";
    
      // ✅ Initialize `currentTurn` with `rolls: []`
      game.currentTurn = {
        playerId: game.players[0].userId.toString(),
        rollCount: 0,
        dice: [],
        selectedDice: [],
        turnScore: 0,
        diceRemaining: 6,
        rolls: [] // ✅ Ensure it starts empty
      };
    
      const updatedGame = await game.save();
      return updatedGame;
    },
    
    

    rollDice: async (_parent: any, args: { gameId: string }, context: { user?: { _id: any } }) => {
      try {
        if (!context.user) {
          throw new GraphQLError("You must be logged in to roll the dice.");
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

        // Ensure the correct player is rolling
        if (context.user._id.toString() !== game.currentTurn.playerId) {
          throw new GraphQLError("It's not your turn. Please wait for your turn.");
        }

        // Number of dice to roll
        const numDice: number = game.currentTurn.diceRemaining || 6;

        // Roll the dice
        const diceResults: number[] = rollDice(numDice);
        console.log("Dice results:", diceResults);

        // Evaluate roll
        const { rollScore, scoringDiceCount } = evaluateRoll(diceResults);
        console.log("Roll evaluation:", { rollScore, scoringDiceCount });

        // ✅ Ensure `rolls` array exists before pushing a new roll
        if (!game.currentTurn.rolls) {
          game.currentTurn.rolls = [];
        }

        // ✅ Store roll in the turn's roll history
        game.currentTurn.rolls.push({
          diceRolled: diceResults,
          pointsEarned: rollScore,
        });

        // 🚨 **Handle Farkle (0 points rolled)**
        if (rollScore === 0) {
          console.log("Farkle detected! Ending turn.");

          // Add Farkle history entry
          game.history.push({
            turnNumber: game.history.length + 1,
            playerId: game.currentTurn.playerId,
            action: "farkle",
            diceRolled: diceResults,
            pointsEarned: 0,
            timestamp: new Date(),
          });

          // Reset turnScore since farkling loses all accumulated points
          game.currentTurn.turnScore = 0;

          // Move to next player
          const currentPlayerIndex = game.players.findIndex(
            (player) => player.userId.toString() === game.currentTurn!.playerId
          );

          if (currentPlayerIndex === -1) {
            throw new GraphQLError("Active player not found in the game.");
          }

          // Set next player (circular order)
          const nextPlayerIndex = (currentPlayerIndex + 1) % game.players.length;
          game.currentTurn = {
            playerId: game.players[nextPlayerIndex].userId.toString(),
            rollCount: 0,
            dice: [],
            selectedDice: [],
            turnScore: 0,
            diceRemaining: 6, // Reset to 6 for new turn
            rolls: [] // ✅ Reset rolls for new turn
          };

          // **Save and return updated game state (to reflect new turn)**
          const updatedGame = await game.save();
          return updatedGame;
        }

        // ✅ **Accumulate turnScore across rolls**
        game.currentTurn.turnScore += rollScore;

        // Update remaining dice
        let newDiceRemaining = numDice - scoringDiceCount;
        if (newDiceRemaining === 0) {
          newDiceRemaining = 6; // Hot dice rule
        }
        game.currentTurn.diceRemaining = newDiceRemaining;

        // Add roll history
        game.history.push({
          turnNumber: game.history.length + 1,
          playerId: game.currentTurn.playerId,
          action: "roll",
          diceRolled: diceResults,
          pointsEarned: rollScore,
          timestamp: new Date(),
        });

        // **Save and return updated game**
        const updatedGame = await game.save();
        return updatedGame;

      } catch (error) {
        console.error("Error in rollDice mutation:", error);
        throw new GraphQLError("Failed to roll dice.");
      }
    },

    endTurn: async (_parent: any, args: { gameId: string }, context: { user?: { _id: any } }) => {
      try {
        if (!context.user) {
          throw new GraphQLError("You must be logged in to end the turn.");
        }
    
        // Retrieve the game document
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
    
        // Ensure only the active player can end their turn
        if (context.user._id.toString() !== game.currentTurn.playerId) {
          throw new GraphQLError("It's not your turn.");
        }
    
        // ✅ Call the `endTurn` utility function to process the turn
        const updatedGame = endTurn(game);
    
        // ✅ Save the updated game state
        await updatedGame.save();
        return updatedGame;
    
      } catch (error) {
        console.error("Error in endTurn mutation:", error);
        throw new GraphQLError("Failed to end turn.");
      }
    },
    
    
    
  },
}
export const { joinGame } = gameResolvers.Mutation;
export default gameResolvers;

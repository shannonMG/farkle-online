// Import the Mongoose Game model
import { Game } from '../../models/Game.js';
import { GraphQLError } from 'graphql';
import { IPlayer } from '../../models/Game.js';
import { AuthenticationError } from 'apollo-server-errors';
// import { Invitation } from '../../models/Invitation.js';
import { rollDice, evaluateRoll, endTurn } from '../../utils/farkleUtils.js'
import mongoose from 'mongoose';



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

    gamesInProgressByUser: async (_: any, { userId }: { userId: string }) => {
      

      try {
        // const objectIdUserId = new mongoose.Types.ObjectId(userId); // Convert to ObjectId

        const allGames = await Game.find({
          "players.userId":userId, // Ensure it matches ObjectId format
          status: "inProgress"
        }).lean();

    
        return allGames.map((game: any) => {
          const typedGame = game as { _id: mongoose.Types.ObjectId };
          return {
            ...typedGame,
            gameId: typedGame._id.toString() // ✅ Converts `_id` to `gameId`
          };
        });
      } catch (error) {
        console.error("❌ Error fetching games:", error);
        return [];
      }
    },

    getGameById: async (_: any, { gameId }: { gameId: string }) => {
      console.log("🛠 Fetching game details for Game ID:", gameId);

      if (!mongoose.Types.ObjectId.isValid(gameId)) {
        console.error("❌ Invalid Game ID:", gameId);
        throw new GraphQLError("Invalid game ID format.");
      }

      try {
        const game = await Game.findById(gameId).populate("players.userId", "username").exec();
        if (!game) {
          console.error("❌ Game not found with ID:", gameId);
          throw new GraphQLError("Game not found.");
        }

        console.log("✅ Game found:", game);
        
        return {
          gameId: game._id,
          status: game.status,
          players: game.players.map(player => ({
            userId: player.userId._id.toString(),
            username: (player.userId as any).username,
          })),
        };
      } catch (error) {
        console.error("❌ Error fetching game:", error);
        throw new GraphQLError("Failed to fetch game details.");
      }
    },

    getActivePlayer: async (_: any, { gameId }: { gameId: string }) => {
      try {
        console.log("🔍 Fetching active player for Game ID:", gameId);
    
        // Find the game and populate the players
        const game = await Game.findById(gameId).populate({ path: "players.userId", select: "username" });
    
        if (!game) {
          throw new Error("Game not found.");
        }
    
        // Find the active player in the players array
        const activePlayer = game.players.find(player => player.isActive);
    
        if (!activePlayer) {
          throw new Error("No active player for this game.");
        }
    
        return {
          userId: activePlayer.userId._id.toString(),  // Ensure ObjectId is a string
          username: (activePlayer.userId as any).username,
        };
      } catch (error) {
        console.error("❌ Error fetching active player:", error);
        throw new Error("Failed to get active player.");
      }
    },
    
    
  },


  Mutation: {
    // Mutation resolver for creating a new game.
    createGame: async (_parent: any, args: { input: { gameId?: string; targetScore: number } }, context: any) => {
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
          players: [
            {
              userId: context.user._id, // Automatically add the game creator
              username: context.user.username,
              totalScore: 0,
              turnScore: 0,
              order: 1, // Creator is always the first player
              isActive: false, // Becomes active when the game starts
            }
          ],             // No players have joined yet.
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
          console.log("🛑 No current turn found! Game State:", game);
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
    
    leaveGame: async (_parent: any, args: { gameId: string }, context: Context) => {
      const { gameId } = args;

      // 1. Ensure the user is authenticated
      if (!context.user || !context.user._id) {
        throw new AuthenticationError("You must be logged in to leave a game.");
      }

      // 2. Find the game
      let game = await Game.findOne({ _id: gameId }); 
      if (!game) {
        throw new GraphQLError("Game not found.");
      }

      // 3. Check if the user is actually a player in this game
      const isPlayerInGame = game.players.some(
        (player) => player.userId.toString() === context.user!._id.toString()
      );
      if (!isPlayerInGame) {
        throw new GraphQLError("You are not a player in this game.");
      }

      // 4. Remove the player from the game
      //    (Assuming `game.players` is an array of { userId, ... })
      game.players = game.players.filter(
        (player) => player.userId.toString() !== context.user!._id.toString()
      );


      // 6. Save the updated game
      await game.save();

      // 7. Return the updated game
      return game;
    },
    
    
  },
}
export const { joinGame } = gameResolvers.Mutation;
export default gameResolvers;




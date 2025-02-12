import { Game } from '../../models/Game.js';
import { Invitation } from '../../models/Invitation.js';
import { User } from '../../models/User.js';
import { GraphQLError } from 'graphql';
import { joinGame } from "../Game/gameResolvers.js";




interface Context {
    user?: {
      _id: any;        // Typically a Mongoose ObjectId
      username: string;
      // Other fields if needed...
    };
  }
  const invitationResolvers = {
    Mutation: {
      sendInvitation: async (
        _parent: any,
        args: { gameId: string; inviteeUsername: string },
        context: Context // ✅ Use the Context interface
      ) => {
        console.log("🛠️ Checking authenticated user in sendInvitation:", context.user); // 🔍 Debugging
  
        if (!context.user) {
          throw new GraphQLError("You must be logged in to send an invitation.");
        }
  
        const { gameId, inviteeUsername } = args;
  
        // ✅ Find the game
        const game = await Game.findOne({ gameId });
        if (!game) {
          throw new GraphQLError("Game not found.");
        }
  
        if (game.status !== "waiting") {
          throw new GraphQLError("Cannot send invitations for a game that has already started.");
        }
  
        // ✅ Find the inviter (who is sending the invite)
        const inviter = await User.findById(context.user._id);
        if (!inviter) {
          throw new GraphQLError("Inviter not found.");
        }
  
        // ✅ Find the invitee (who is receiving the invite)
        const invitee = await User.findOne({ username: inviteeUsername });
        if (!invitee) {
          throw new GraphQLError("Invitee not found.");
        }
  
        // ✅ Check if the invitee is already in the game
        const isAlreadyInGame = game.players.some(
          (player) => player.userId.toString() === invitee._id.toString()
        );
        if (isAlreadyInGame) {
          throw new GraphQLError("User is already in the game.");
        }
  
        // ✅ Check if an invitation already exists
        const existingInvitation = await Invitation.findOne({
          gameId,
          inviteeId: invitee._id,
          status: "pending",
        });
  
        if (existingInvitation) {
          throw new GraphQLError("An invitation for this user already exists.");
        }
  
        // ✅ Create a new invitation
        const newInvitation = new Invitation({
          gameId,
          inviterId: context.user._id, // ✅ Use context.user instead of manually calling authenticateToken
          inviteeId: invitee._id,
          status: "pending",
        });
  
        await newInvitation.save();
  
        return newInvitation;
      },
      acceptInvitation: async (
        _parent: any,
        args: { invitationId: string },
        context: Context
      ) => {
        console.log("🛠️ Checking authenticated user in acceptInvitation:", context.user); // Debugging
  
        if (!context.user) {
          throw new GraphQLError("You must be logged in to accept an invitation.");
        }
  
        const { invitationId } = args;
  
        // ✅ Find the invitation document
        const invitation = await Invitation.findById(invitationId);
        if (!invitation) {
          throw new GraphQLError("Invitation not found.");
        }
  
        // ✅ Ensure the invitation is still pending
        if (invitation.status !== "pending") {
          throw new GraphQLError("This invitation is no longer valid.");
        }
  
        // ✅ Ensure the user accepting is the invitee
        if (invitation.inviteeId.toString() !== context.user._id.toString()) {
          throw new GraphQLError("You are not the intended recipient of this invitation.");
        }
  
        // ✅ Call joinGame mutation to add the user to the game
        await joinGame(
          _parent,
          { input: { gameId: invitation.gameId } },
          context
        );
  
        // ✅ Update invitation status to "accepted"
        invitation.status = "accepted";
        await invitation.save();
  
        return invitation;
      },
    },
 };

 
  
  export default invitationResolvers;
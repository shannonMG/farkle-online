import { Game } from '../../models/Game.js';
import { Invitation } from '../../models/Invitation.js';
import { User } from '../../models/User.js';
import { GraphQLError } from 'graphql';
import { joinGame } from "../Game/gameResolvers.js";
import { AuthenticationError } from 'apollo-server-errors';
import { Notification } from '../../models/Notification.js';

interface Context {
    user?: {
      _id: any;        // Typically a Mongoose ObjectId
      username: string;
      // Other fields if needed...
    };
  }

  

  const invitationResolvers = {
    Query: {
      getPendingInvitations: async (_parent: any, args: any, context: Context) => {
        console.log("🛠️ Checking authenticated user in getPendingInvitations:", context.user);
        console.log("🔍 Debugging inviteeId:", args.input.inviteeId);
        // Ensure the user is authenticated
        if (!context.user || !context.user._id) {
          throw new AuthenticationError("You must be logged in to view pending invitations.");
        }
      
        try {
          // Find all pending invitations for the logged-in user
          const pendingInvitations = await Invitation.find({
            inviteeId: context.user._id,
            status: "pending"
          }).populate("inviterId", "username"); // Populate inviter details
      
          return pendingInvitations;
        } catch (error) {
          console.error("Error fetching pending invitations:", error);
          throw new GraphQLError("Failed to fetch pending invitations.");
        }
      }
    },

    Mutation: {
      sendInvitation: async (
        _parent: any,
        args: { input: { gameId: string; inviteeUsername: string; inviteeId: string } },
        context: Context
      ) => {
        console.log("🛠️ Checking raw args:", JSON.stringify(args, null, 2)); // Debugging
      
        // Ensure user is logged in
        if (!context.user) {
          throw new GraphQLError("You must be logged in to send an invitation.");
        }
      
        // Destructure from args.input
        const { gameId, inviteeUsername, inviteeId } = args.input;
      
        // Look up the game by gameId
        const game = await Game.findOne({ gameId });
        if (!game) {
          console.log("❌ Game not found in database.");
          throw new GraphQLError("Game not found.");
        }
      
        // Ensure the game is still in "waiting" status
        if (game.status !== "waiting") {
          throw new GraphQLError("Cannot send invitations for a game that has already started.");
        }
      
        // Find the invitee user by ID (and optionally verify the username, if desired)
        const invitee = await User.findOne({ _id: inviteeId, username: inviteeUsername });
        if (!invitee) {
          throw new GraphQLError("Invitee not found.");
        }
      
        // Check if the invitee is already in the game
        const isAlreadyInGame = game.players.some(
          (player) => player.userId.toString() === invitee._id.toString()
        );
        if (isAlreadyInGame) {
          throw new GraphQLError("User is already in the game.");
        }
      
        // Check if there is already a pending invitation for this user & game
        const existingInvitation = await Invitation.findOne({
          gameId,
          inviteeId: invitee._id,
          status: "pending",
        });
        if (existingInvitation) {
          throw new GraphQLError("An invitation for this user already exists.");
        }
      
        // Create a new invitation
        const newInvitation = new Invitation({
          gameId,
          inviterId: context.user._id,
          inviteeId: invitee._id,
          status: "pending",
        });
        await newInvitation.save();
      
        // Create a notification for the invitee (optional)
        const notification = new Notification({
          userId: invitee._id,
          type: "invite",
          message: `${context.user.username} invited you to a game!`,
        });
        await notification.save();
      
        return newInvitation;
      },
      

      acceptInvitation: async (
        _parent: any,
        args: { invitationId: string },
        context: Context
      ) => {
        console.log("🛠️ Checking authenticated user in acceptInvitation:", context.user);
      
        // Ensure the user is authenticated
        if (!context.user || !context.user._id) {
          console.error("❌ No authenticated user in acceptInvitation.");
          throw new AuthenticationError("You must be logged in to accept an invitation.");
        }
      
        const { invitationId } = args;
      
        // 1. Find the invitation
        const invitation = await Invitation.findById(invitationId);
        if (!invitation) {
          throw new GraphQLError("Invitation not found.");
        }
      
        // 2. Check invitation status
        if (invitation.status !== "pending") {
          throw new GraphQLError("This invitation is no longer valid.");
        }
      
        // 3. Validate that the logged-in user is the invitee
        if (invitation.inviteeId.toString() !== context.user._id.toString()) {
          throw new GraphQLError("You are not the intended recipient of this invitation.");
        }
      
        // 4. Add user to the game (your existing joinGame logic)
        await joinGame(
          _parent,
          { input: { gameId: invitation.gameId } },
          { ...context }
        );
      
        // 5. Update invitation status
        invitation.status = "accepted";
        await invitation.save();
      
        // 6. Create a notification for the inviter
        try {
          const acceptedNotification = new Notification({
            userId: invitation.inviterId, // The user who sent the invite
            type: "inviteAccepted",
            message: `${context.user.username} has accepted your invitation!`,
          });
          await acceptedNotification.save();
          console.log("✅ Invitation acceptance notification saved.");
        } catch (error) {
          console.error("❌ Error saving acceptance notification:", error);
        }
      
        return invitation;
      },
      
      declineInvitation: async (
        _parent: any,
        args: { invitationId: string },
        context: Context
      ) => {
        console.log("🛠 Checking authenticated user in declineInvitation:", context.user);
      
        // Ensure the user is logged in
        if (!context.user || !context.user._id) {
          console.error("❌ No authenticated user in declineInvitation.");
          throw new AuthenticationError("You must be logged in to decline an invitation.");
        }
      
        const { invitationId } = args;
      
        // 1. Find the invitation
        const invitation = await Invitation.findById(invitationId);
        if (!invitation) {
          throw new GraphQLError("Invitation not found.");
        }
      
        // 2. Check invitation status
        if (invitation.status !== "pending") {
          throw new GraphQLError("This invitation is no longer valid.");
        }
      
        // 3. Validate that the logged-in user is the invitee
        if (invitation.inviteeId.toString() !== context.user._id.toString()) {
          throw new GraphQLError("You are not the intended recipient of this invitation.");
        }
      
        // 4. Update invitation status
        invitation.status = "declined";
        await invitation.save();
      
        console.log(`✅ Invitation ${invitationId} has been declined.`);
      
        // 5. Create a notification for the inviter
        try {
          const declinedNotification = new Notification({
            userId: invitation.inviterId, // The user who sent the invite
            type: "inviteDeclined",
            message: `${context.user.username} has declined your invitation.`,
          });
          await declinedNotification.save();
          console.log("✅ Invitation decline notification saved.");
        } catch (error) {
          console.error("❌ Error saving decline notification:", error);
        }
      
        // 6. Return the updated invitation
        return invitation;
      },
      
      

    },
 };

 
  
  export default invitationResolvers;
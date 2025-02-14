import { Notification } from "../../models/Notification.js";
import { AuthenticationError} from 'apollo-server-express'
import { GraphQLError } from "graphql";


interface Context {
  user?: {
    _id: string;
    username: string;
    // ... any other fields you store in context
  };
}

interface NotificationFilterInput {
  isRead?: boolean;
  type?: string;
}

const notificationResolvers = {
  Query: {
    getMyNotifications: async (
      _parent: any,
      args: { filter?: NotificationFilterInput; limit?: number },
      context: Context
    ) => {
      // 1. Ensure user is logged in
      if (!context.user || !context.user._id) {
        throw new AuthenticationError("You must be logged in to view notifications.");
      }

      const { filter, limit } = args;

      // 2. Build a query object to filter notifications
      const query: any = { userId: context.user._id };

      // If the client passes a filter, apply it:
      if (filter?.isRead !== undefined) {
        query.isRead = filter.isRead; // e.g. true/false
      }
      if (filter?.type) {
        query.type = filter.type; // e.g. "invite", "inviteAccepted"
      }

      // 3. Set a default limit if not provided (e.g., 50)
      const maxResults = limit ?? 50;

      // 4. Fetch the notifications (sorted newest-first)
      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(maxResults);

      // 5. Return the list
      return notifications;
    },
  },
  Mutation: {
    markNotificationAsRead: async (
      _parent: any,
      args: { notificationId: string },
      context: Context
    ) => {

     const { notificationId } = args;

    // console.log("Context user:", context.user); 
    // console.log("notificationId argument:", notificationId);
      // 1. Ensure the user is authenticated
      if (!context.user || !context.user._id) {
        throw new AuthenticationError("You must be logged in to update notifications.");
      }

      // 2. Find & update notification for the current user
      const updatedNotification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId: context.user._id }, 
        { $set: { isRead: true } },
        { new: true } // return the updated document
      );
      console.log("🔍 notificationId:", notificationId);
      console.log("🔍 context.user._id:", context.user._id);


      if (!updatedNotification) {
        throw new GraphQLError("Notification not found or not owned by the current user.");
      }

      return updatedNotification;
    },
  },
};

export default notificationResolvers;

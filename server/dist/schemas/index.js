import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';
import userTypeDefs from './User/userTypeDefs.js';
import userResolvers from './User/userResolvers.js';
import gameTypeDefs from './Game/gameTypeDefs.js';
import gameResolvers from './Game/gameResolvers.js';
import invitationTypeDefs from './Invitation/invitationTypeDefs.js';
import invitationResolvers from './Invitation/invitationResolvers.js';
import notificationResolvers from "./Notification/notificationResolvers.js";
import notificationTypeDefs from "./Notification/notificationTypeDefs.js";
const typeDefs = mergeTypeDefs([userTypeDefs, gameTypeDefs, invitationTypeDefs, notificationTypeDefs]);
// Combine resolvers and explicitly type them
const resolvers = mergeResolvers([userResolvers, gameResolvers, invitationResolvers, notificationResolvers]);
export { typeDefs, resolvers };

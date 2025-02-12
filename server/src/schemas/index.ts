import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';
import { IResolvers } from '@graphql-tools/utils';

import userTypeDefs from './User/userTypeDefs.js';
import userResolvers from './User/userResolvers.js';

import gameTypeDefs from './Game/gameTypeDefs.js';
import gameResolvers from './Game/gameResolvers.js';

import invitationTypeDefs from './Invitation/invitationTypeDefs.js'; 
import invitationResolvers from './Invitation/invitationResolvers.js';
// Combine typeDefs
const typeDefs = mergeTypeDefs([userTypeDefs, gameTypeDefs, invitationTypeDefs]);

// Combine resolvers and explicitly type them
const resolvers: IResolvers = mergeResolvers([userResolvers, gameResolvers, invitationResolvers]) as IResolvers;

export { typeDefs, resolvers };

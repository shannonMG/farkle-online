import { gql } from 'apollo-server-express';

const notificationTypeDefs = gql`



type Notification {
    _id: ID!
    userId: ID!       # or a User type if you prefer to populate
    type: String!
    message: String!
    isRead: Boolean!
    createdAt: String!
  }
  
  input NotificationFilterInput {
    isRead: Boolean
    type: String
  }
  
  extend type Query {
    getMyNotifications(filter: NotificationFilterInput): [Notification!]!
  }
    
  extend type Mutation {
    markNotificationAsRead(notificationId: ID!): Notification!
  }       
  `
  export default notificationTypeDefs;
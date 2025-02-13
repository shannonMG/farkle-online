import { gql } from 'apollo-server-express';

const invitationTypeDefs = gql`


type Invitation {
    _id: ID!
    gameId: ID!
    inviterId: User!
    inviteeId: ID!
    status: String!
    createdAt: String!
    updatedAt: String!
  }
type User {
    _id: ID!
    username: String!
  }
  
input InvitationInput {
  gameId: String!
  inviteeUsername: String!
  inviteeId: ID! # ✅ Ensure this is included
  
}

  
  extend type Query{
    getPendingInvitations: [Invitation!]!
  }

  extend type Mutation {
    sendInvitation(input: InvitationInput!): Invitation!
    acceptInvitation(invitationId: ID!): Invitation!
    declineInvitation(invitationId: ID!): Invitation!
  }
  `

  export default invitationTypeDefs;
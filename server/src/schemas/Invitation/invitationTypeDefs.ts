import { gql } from 'apollo-server-express';

const invitationTypeDefs = gql`


type Invitation {
    _id: ID!
    gameId: ID!
    inviterId: ID!
    inviteeId: ID!
    status: String!
    createdAt: String!
    updatedAt: String!
  }
  
  extend type Mutation {
    sendInvitation(gameId: ID!, inviteeUsername: String!): Invitation!
    acceptInvitation(invitationId: ID!): Invitation!
  }
  `

  export default invitationTypeDefs;
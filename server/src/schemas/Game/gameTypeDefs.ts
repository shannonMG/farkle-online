import { gql } from 'apollo-server-express';

const gameTypeDefs = gql`
  type Mutation {
    addGame(playerUsernames: [String]!): Game
  }

  type Query{
    gamesByUser: [Game!]!
    }
  
  type Game {
    _id: ID!
    participants: [User]!
    status: String!
    turnIndex: Int!
    scores: [ScoreEntry]!
    roundScores: [ScoreEntry]!
    currentDice: [Int]!
    createdAt: String!
    updatedAt: String!
  }
  
  type ScoreEntry {
    userId: ID!
    score: Int!
  }
  `
  export default gameTypeDefs;
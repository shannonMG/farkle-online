import { gql } from 'apollo-server-express';

const gameTypeDefs = gql`
# Define a Player type that matches your IPlayer interface.
    type Player {
        userId: ID!    
        username: String       
        totalScore: Int!
        turnScore: Int!
        order: Int!
        isActive: Boolean!
        }

    # Define the CurrentTurn type.
    type CurrentTurn {
        playerId: String!    
        rollCount: Int!
        dice: [Int!]!        
        selectedDice: [Int!]! 
        turnScore: Int!
        diceRemaining: Int! 
        }

    # Define a HistoryEntry type.
    type HistoryEntry {
        turnNumber: Int!
        playerId: String!
        action: String!
        diceRolled: [Int!]!
        pointsEarned: Int!
        timestamp: String!    
        }

    # Define the Game type that corresponds to your IGame interface.
    type Game {
        gameId: String!
        createdAt: String!  
        updatedAt: String!
        status: String!     
        targetScore: Int!
        players: [Player!]!
        currentTurn: CurrentTurn 
        history: [HistoryEntry!]!
        }

    input CreateGameInput {
        targetScore: Int! 
        }
    
        
    input JoinGameInput {
        gameId: String!
        }

       

    type Query {
        game(gameId: String!): Game
        games(status: String): [Game!]!
        }
        
    
    type Mutation {
        createGame(input: CreateGameInput!): Game
        joinGame(input: JoinGameInput!): Game
        startGame(gameId: String!): Game
        rollDice(gameId: String!): Game

        }
     `

export default gameTypeDefs
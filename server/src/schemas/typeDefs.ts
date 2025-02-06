import { gql } from 'apollo-server-express';

const typeDefs = gql`
    type User {
        _id: ID!
        username: String!
        email: String!
    }

    type Query {
        users: [User]
    }

    type Mutation {
        register(username: String!, email: String!, password: String!): User
    }
`;

export default typeDefs;

import { gql } from 'apollo-server-express';

const userTypeDefs = gql`
    type User {
        _id: ID!
        username: String!
        email: String!
    }

    type AuthPayload {
        token: String!
        user: User!
    }

    type LogoutResponse {
        message: String!
     }

    type Query {
        users: [User]
        me: User
    }


    type Mutation {
        register(username: String!, email: String!, password: String!): AuthPayload!
        login(username: String!, password: String!): AuthPayload!
        logout: LogoutResponse!
    }
`;

export default userTypeDefs;

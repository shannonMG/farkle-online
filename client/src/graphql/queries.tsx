import { gql } from "@apollo/client";

export const GET_ME = gql`
  query GetMe {
    me {
      _id
      username
      email
    }
  }
`;

export const GET_USERS = gql`
  query GetUsers {
    users {
      _id
      username
    }
  }
`;

export const GET_GAMES_BY_USER = gql`
  query GetGamesByUser {
    gamesByUser {
      _id
      status
      participants {
        _id
        username
      }
    }
  }
`;

export const GET_PENDING_INVITATIONS = gql`
  query GetPendingInvitations {
    getPendingInvitations {
      _id
      gameId
      inviterId {
        _id
        username
        email
      }
      inviteeId
      status
      createdAt
      updatedAt
    }
}
`

export const GET_MY_NOTIFICATIONS = gql`
query GetMyNotifications($filter: NotificationFilterInput) {
  getMyNotifications(filter: $filter) {
    _id
    userId
    type
    message
    isRead
    createdAt
  }
}
`
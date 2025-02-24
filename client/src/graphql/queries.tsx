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
  query GetGamesByUser($userId: ID!) {
    gamesByUser(userId: $userId) {
      _id
      gameId
      createdAt
      updatedAt
      status
      targetScore
      players {
        userId  # Change to match your actual Player type fields
        username  # Ensure this exists in your Player type
      }
      currentTurn {
        playerId
      }
      history {
        turnNumber
        playerId
      }
    }
  }
`;

export const GET_GAMES_IN_PROGRESS_BY_USER = gql`
  query GetGamesInProgressByUser($userId: ID!) {
    gamesInProgressByUser(userId: $userId) {
      gameId  # Ensure this matches what the backend returns
      status
      targetScore
      players {
        userId
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
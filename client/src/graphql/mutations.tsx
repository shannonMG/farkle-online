import { gql } from "@apollo/client";

export const LOGIN_USER = gql`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      token
      user {
        _id
        username
        email
      }
    }
  }
`;

export const LOGOUT_USER = gql`
  mutation Logout {
    logout {
      message
    }
  }
`;

export const REGISTER_USER = gql`
  mutation Register($username: String!, $email: String!, $password: String!) {
    register(username: $username, email: $email, password: $password) {
      token
      user {
        _id
        username
        email
      }
    }
  }
`

export const CREATE_GAME = gql`
  mutation CreateGame($input: CreateGameInput!) {
    createGame(input: $input) {
      gameId
      createdAt
      updatedAt
      status
      targetScore
      players {
        userId
        username
        totalScore
        turnScore
        order
        isActive
      }
      currentTurn {
        playerId
        rollCount
        dice
        selectedDice
        turnScore
        diceRemaining
        rolls {
          diceRolled
          pointsEarned
        }
      }
      history {
        turnNumber
        playerId
        action
        diceRolled
        pointsEarned
        timestamp
      }
    }
  }
  `

export const JOIN_GAME = gql`
mutation JoinGame($input: JoinGameInput!) {
  joinGame(input: $input) {
    gameId
    createdAt
    updatedAt
    status
    targetScore
    players {
      userId
      username
      totalScore
      turnScore
      order
      isActive
    }
    currentTurn {
      playerId
      rollCount
      dice
      selectedDice
      turnScore
      diceRemaining
      rolls {
        diceRolled
        pointsEarned
      }
    }
    history {
      turnNumber
      playerId
      action
      diceRolled
      pointsEarned
      timestamp
    }
  }
}
`

export const START_GAME = gql`
mutation StartGame($gameId: String!) {
  startGame(gameId: $gameId) {
    gameId
    createdAt
    updatedAt
    status
    targetScore
    players {
      userId
      username
      totalScore
      turnScore
      order
      isActive
    }
    currentTurn {
      playerId
      rollCount
      dice
      selectedDice
      turnScore
      diceRemaining
      rolls {
        diceRolled
        pointsEarned
      }
    }
    history {
      turnNumber
      playerId
      action
      diceRolled
      pointsEarned
      timestamp
    }
  }
}
`

export const ROLL_DICE = gql`
mutation RollDice($gameId: String!) {
  rollDice(gameId: $gameId) {
    gameId
    createdAt
    updatedAt
    status
    targetScore
    players {
      userId
      username
      totalScore
      turnScore
      order
      isActive
    }
    currentTurn {
      playerId
      rollCount
      dice
      selectedDice
      turnScore
      diceRemaining
      rolls {
        diceRolled
        pointsEarned
      }
    }
    history {
      turnNumber
      playerId
      action
      diceRolled
      pointsEarned
      timestamp
    }
  }
}
`

export const END_TURN = gql`
mutation EndTurn($gameId: ID!) {
  endTurn(gameId: $gameId) {
    gameId
    createdAt
    updatedAt
    status
    targetScore
    players {
      userId
      username
      totalScore
      turnScore
      order
      isActive
    }
    currentTurn {
      playerId
      rollCount
      dice
      selectedDice
      turnScore
      diceRemaining
      rolls {
        diceRolled
        pointsEarned
      }
    }
    history {
      turnNumber
      playerId
      action
      diceRolled
      pointsEarned
      timestamp
    }
  }
}
`

export const SEND_INVITATION = gql`
mutation SendInvitation($input: InvitationInput!) {
  sendInvitation(input: $input) {
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

export const ACCEPT_INVITATION = gql`
mutation AcceptInvitation($invitationId: ID!) {
  acceptInvitation(invitationId: $invitationId) {
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

export const DECLINE_INVITATION = gql`
mutation DeclineInvitation($invitationId: ID!) {
  declineInvitation(invitationId: $invitationId) {
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

export const MARK_NOTIFICATION_AS_READ =  gql`
mutation MarkNotificationAsRead($notificationId: ID!) {
  markNotificationAsRead(notificationId: $notificationId) {
    _id
    userId
    type
    message
    isRead
    createdAt
  }
}
`

export const MARK_ALL_NOTIFICATIONS_AS_READ = gql`
mutation MarkAllNotificationsAsRead {
  markAllNotificationsAsRead {
    _id
    userId
    type
    message
    isRead
    createdAt
  }
}

`

export const LEAVE_GAME = gql`
mutation LeaveGame($gameId: ID!) {
  leaveGame(gameId: $gameId) {
    gameId
    createdAt
    updatedAt
    status
    targetScore
    players {
      userId
      username
      totalScore
      turnScore
      order
      isActive
    }
    currentTurn {
      playerId
      rollCount
      dice
      selectedDice
      turnScore
      diceRemaining
      rolls {
        diceRolled
        pointsEarned
      }
    }
    history {
      turnNumber
      playerId
      action
      diceRolled
      pointsEarned
      timestamp
    }
  }
}
`
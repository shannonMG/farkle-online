import {IGame} from '../models/Game'

// Refactored rollDice: no DOM manipulation, just returns an array of random dice results.
export function rollDice(numDice: number): number[] {
  const results: number[] = [];
  for (let i = 0; i < numDice; i++) {
    const roll = Math.floor(Math.random() * 6) + 1;
    results.push(roll);
  }
  return results;
}

// Evaluate the dice roll as before.
export function evaluateRoll(dice: number[]): { rollScore: number; scoringDiceCount: number } {
  const counts: { [key: number]: number } = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0};
  dice.forEach(die => {
    counts[die]++;
  });

  let score = 0;
  let scoringDiceCount = 0;

  // Check for 6-of-a-Kind.
  for (let i = 1; i <= 6; i++) {
    if (counts[i] === 6) {
      return { rollScore: 3000, scoringDiceCount: 6 };
    }
  }

  // Check for 2 Triplets.
  let tripletCount = 0;
  for (let i = 1; i <= 6; i++) {
    if (counts[i] >= 3) {
      tripletCount++;
    }
  }
  if (tripletCount === 2) {
    return { rollScore: 2500, scoringDiceCount: 6 };
  }

  // Check for 3 Pairs.
  let pairCount = 0;
  for (let i = 1; i <= 6; i++) {
    if (counts[i] === 2) {
      pairCount++;
    }
  }
  if (pairCount === 3) {
    return { rollScore: 1500, scoringDiceCount: 6 };
  }

  // Check for a Straight (1-2-3-4-5-6).
  let isStraight = true;
  for (let i = 1; i <= 6; i++) {
    if (counts[i] !== 1) {
      isStraight = false;
      break;
    }
  }
  if (isStraight) {
    return { rollScore: 1500, scoringDiceCount: 6 };
  }

  // Check for Three 1's.
  if (counts[1] >= 3) {
    score += 1000;
    scoringDiceCount += 3;
    counts[1] -= 3;
  }

  // Check for Three-of-a-Kind for numbers 2-6.
  for (let i = 2; i <= 6; i++) {
    if (counts[i] >= 3) {
      score += i * 100;
      scoringDiceCount += 3;
      counts[i] -= 3;
    }
  }

  // Score remaining 1's and 5's.
  score += counts[1] * 100;
  scoringDiceCount += counts[1];

  score += counts[5] * 50;
  scoringDiceCount += counts[5];

  return { rollScore: score, scoringDiceCount };
}

export function endTurn(game: IGame): IGame {
  if (!game.currentTurn) {
    throw new Error("No active turn to end.");
  }

  // Find the current player
  const currentPlayerIndex = game.players.findIndex(
    (player) => player.userId.toString() === game.currentTurn!.playerId
  );

  if (currentPlayerIndex === -1) {
    throw new Error("Current player not found.");
  }

  // ✅ Ensure `rolls` exists before banking score
  if (!game.currentTurn.rolls) {
    game.currentTurn.rolls = [];
  }

  // ✅ Bank turnScore into totalScore
  game.players[currentPlayerIndex].totalScore += game.currentTurn.turnScore;

  // ✅ Log the completed turn in history
  const lastRoll = game.currentTurn.rolls.length > 0 
    ? game.currentTurn.rolls[game.currentTurn.rolls.length - 1].diceRolled 
    : [];

  game.history.push({
    turnNumber: game.history.length + 1,
    playerId: game.currentTurn.playerId,
    action: "endTurn",
    diceRolled: lastRoll,
    pointsEarned: game.currentTurn.turnScore,
    timestamp: new Date(),
  });

  // ✅ Check for a winner before moving to the next player
  if (game.players[currentPlayerIndex].totalScore >= game.targetScore) {
    game.status = "completed";  // 🏆 Mark game as completed
    return game;  // Stop further processing
  }

  // ✅ Move to the next player
  const nextPlayerIndex = (currentPlayerIndex + 1) % game.players.length;

  // ✅ Update `isActive` for players
  game.players.forEach((player, index) => {
    player.isActive = index === nextPlayerIndex;  // Set new player as active
  });

  // ✅ Update currentTurn with the new active player
  game.currentTurn = {
    playerId: game.players[nextPlayerIndex].userId.toString(),
    rollCount: 0,
    dice: [],
    selectedDice: [],
    turnScore: 0,
    diceRemaining: 6,
    rolls: [],
  };

  return game;
}

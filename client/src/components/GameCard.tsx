import React from "react";
import { useMutation } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import { LEAVE_GAME } from "../graphql/mutations";
import { GET_GAMES_IN_PROGRESS_BY_USER } from "../graphql/queries";

interface GameCardProps {
  game: {
    gameId: string;
    status: string;
    players: { userId: string; username: string }[];
  };
  currentUserId: string;
}

const GameCard: React.FC<GameCardProps> = ({ game, currentUserId }) => {
  const navigate = useNavigate();
  const [leaveGame, { loading: leavingGame, error: leaveError }] = useMutation(LEAVE_GAME, {
    refetchQueries: [{ query: GET_GAMES_IN_PROGRESS_BY_USER }],
  });

  console.log(`🛠 Rendering GameCard for Game ID: ${game.gameId}`);
  console.log("🛠 Game Players:", game.players.map(player => player.userId));
  console.log("🛠 Current User ID:", currentUserId);

  const handleEnterGame = () => {
    console.log(`🎮 Entering Game Lobby for Game ID: ${game.gameId}`);
    navigate(`/game/${game.gameId}`);
  };

  const handleLeaveGame = async () => {
    console.log("🚀 Leave Game button clicked!"); // ✅ Confirm function is running
    console.log("🔍 Current Game ID:", game.gameId);
  
    if (!game.gameId) {
      console.error("❌ Error: gameId is undefined. Cannot leave game.");
      return; // Stop execution if gameId is missing
    }
  
    try {
      await leaveGame({ variables: { gameId: game.gameId } });
      console.log("✅ Successfully left the game.");
    } catch (error) {
      console.error("❌ Error leaving game:", error);
    }
  };
  

  return (
    <div className="game-card">
      <h3>Game ID: {game.gameId}</h3>
      <p>Status: {game.status}</p>
      <p>Players: {game.players.map((p) => p.username).join(", ")}</p>

      {/* ✅ Always show these buttons since the user is in the game */}
      <button onClick={handleEnterGame}>Enter Game</button>
      <button onClick={handleLeaveGame} disabled={leavingGame}>
        {leavingGame ? "Leaving..." : "Leave Game"}
      </button>

      {/* ✅ Log GraphQL errors if they occur */}
      {leaveError && <p className="error-message">Error leaving game: {leaveError.message}</p>}
    </div>
  );
};

export default GameCard;

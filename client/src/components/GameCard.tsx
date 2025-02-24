import React from "react";
import { useMutation } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import { LEAVE_GAME } from "../graphql/mutations";
import { GET_GAMES_BY_USER } from "../graphql/queries"; // ✅ To refetch games after leaving

interface GameCardProps {
  game: {
    gameId: string; // ✅ Use gameId instead of _id
    status: string;
    players: { userId: string; username: string }[]; // ✅ Use players instead of participants
  };
  currentUserId: string;
}


const GameCard: React.FC<GameCardProps> = ({ game, currentUserId }) => {
  const navigate = useNavigate();
  const [leaveGame, { loading: leavingGame }] = useMutation(LEAVE_GAME, {
    refetchQueries: [{ query: GET_GAMES_BY_USER }], // ✅ Refresh the game list after leaving
  });

  const isPlayerInGame = game.players.some((player) => player.userId === currentUserId);
  const canLeaveGame = isPlayerInGame && (game.status === "waiting" || game.status === "in-progress");

  const handleJoinGame = () => {
    navigate(`/game/${game.gameId}`);
  };

  const handleLeaveGame = async () => {
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

      {isPlayerInGame ? (
        <button onClick={handleJoinGame}>Join Game</button>
      ) : (
        <button disabled>Joined</button>
      )}

      {/* ✅ Show Leave Game Button if allowed */}
      {canLeaveGame && (
        <button onClick={handleLeaveGame} disabled={leavingGame}>
          {leavingGame ? "Leaving..." : "Leave Game"}
        </button>
      )}
    </div>
  );
};

export default GameCard;

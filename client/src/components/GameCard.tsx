import React from "react";
import { useNavigate } from "react-router-dom";

interface GameCardProps {
    game: {
      _id: string;
      status: string;
      participants: { _id: string; username: string }[];
    };
    currentUserId: string; // ✅ Correct placement outside `game`
  }
  


const GameCard: React.FC<GameCardProps> = ({ game, currentUserId }) => {
  const navigate = useNavigate();

  const isPlayerInGame = game.participants.some((player) => player._id === currentUserId);

  const handleJoinGame = () => {
    navigate(`/game/${game._id}`);
  };

  return (
    <div className="game-card">
      <h3>Game ID: {game._id}</h3>
      <p>Status: {game.status}</p>
      <p>Players: {game.participants.map((p) => p.username).join(", ")}</p>
      
      {isPlayerInGame ? (
        <button onClick={handleJoinGame}>Join Game</button>
      ) : (
        <button disabled>Not in Game</button>
      )}
    </div>
  );
};

export default GameCard;

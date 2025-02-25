import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";
import { GET_GAME_BY_ID } from "../graphql/queries";
import { START_GAME } from "../graphql/mutations";
// import styles from "./GameLobby.module.css";

// Define the Player type
type Player = {
  userId: string;
  username: string;
};


const GameLobby = () => {
  const { gameId } = useParams(); // ✅ Get gameId from URL
  const navigate = useNavigate();

  // Fetch game data
  const { loading, error, data } = useQuery(GET_GAME_BY_ID, {
    variables: { gameId },
    skip: !gameId, // ✅ Only fetch if gameId exists
  });

  // Start game mutation
  const [startGame, { loading: startingGame }] = useMutation(START_GAME, {
    variables: { gameId },
    refetchQueries: [{ query: GET_GAME_BY_ID, variables: { gameId } }],
  });

  if (loading) return <p>Loading game details...</p>;
  if (error) return <p>Error loading game: {error.message}</p>;

  const game = data?.getGameById;

  const handleStartGame = async () => {
    try {
      await startGame();
      console.log("✅ Game started!");
    } catch (err) {
      console.error("❌ Error starting game:", err);
    }
  };

  return (
    <div>
      <h1>Game Lobby</h1>
      <p><strong>Game ID:</strong> {gameId}</p>
      <p><strong>Status:</strong> {game.status}</p>

      <h2>Players</h2>
      <ul>
        {game.players.map((player: Player) => (
          <li key={player.userId}>{player.username}</li>
        ))}
      </ul>

      {/* Show Start Game button if game is in 'waiting' status */}
      {game.status === "waiting" && (
        <button onClick={handleStartGame} disabled={startingGame}>
          {startingGame ? "Starting..." : "Start Game"}
        </button>
      )}

      <button onClick={() => navigate("/")}>Return to Dashboard</button>
    </div>
  );
};

export default GameLobby;

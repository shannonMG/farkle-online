import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_ME, GET_GAMES_BY_USER } from "../graphql/queries"; // ✅ Added GET_GAMES_BY_USER
import { LOGOUT_USER } from "../graphql/mutations";
import { useNavigate } from "react-router-dom";
import AddGameForm from "../components/AddGameForm";
import GameCard from "../components/GameCard"; // ✅ Import GameCard component

interface Game {
  _id: string;
  status: string;
  participants: {
    _id: string;
    username: string;
  }[];
}



const Dashboard = () => {
  const navigate = useNavigate();
  const { loading, error, data } = useQuery(GET_ME);
  const { loading: gamesLoading, error: gamesError, data: gamesData } = useQuery(GET_GAMES_BY_USER); // ✅ Fetch user games
  const [logoutUser] = useMutation(LOGOUT_USER);
  const [showForm, setShowForm] = useState(false);

  if (loading) return <p>Loading...</p>;
  if (error) {
    console.error("🚨 Error fetching user data:", error);
    return (
      <div>
        <p>Error loading data. Please try logging in again.</p>
        <button onClick={() => {
          localStorage.removeItem("id_token");
          navigate("/login");
        }}>
          Return to Login
        </button>
      </div>
    );
  }

  const user = data?.me;

  if (!user) {
    return (
      <div>
        <p>User not found. Please log in again.</p>
        <button onClick={() => {
          localStorage.removeItem("id_token");
          navigate("/login");
        }}>
          Return to Login
        </button>
      </div>
    );
  }

  // Function to handle logout

  const handleLogout = async () => {
    try {
      await logoutUser();
      localStorage.removeItem("id_token");
      navigate("/login");
      window.location.reload();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <div>
      <h1>Welcome, {user.username}!</h1>

      <button onClick={() => setShowForm(true)}>Add Game</button>

      {showForm && <AddGameForm onClose={() => setShowForm(false)} />}

      {/* ✅ Display Active Games */}
      <h2>Your Active Games</h2>
      {gamesLoading && <p>Loading your games...</p>}
      {gamesError && <p>Error loading games: {gamesError.message}</p>}
      {gamesData?.gamesByUser?.length > 0 ? (
        gamesData.gamesByUser.map((game: Game) => (
          <GameCard key={game._id} game={game} currentUserId={user._id} />
        ))
      ) : (
        <p>You are not in any active games.</p>
      )}

      {/* Logout Button */}
      <button onClick={handleLogout} style={{ cursor: "pointer", marginTop: "20px" }}>
        Logout
      </button>
    </div>
  );
};

export default Dashboard;

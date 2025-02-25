import { useQuery, useMutation } from "@apollo/client";
import { GET_ME, GET_GAMES_IN_PROGRESS_BY_USER, GET_PENDING_INVITATIONS } from "../graphql/queries";
import { LOGOUT_USER } from "../graphql/mutations";
import { useNavigate } from "react-router-dom";
import AddGameForm from "../components/AddGameForm";
import GameCard from "../components/GameCard";
import InvitationCard from "../components/InvitationCard";
import { useState } from "react";
import styles from "./Dashboard.module.css";

interface Game {
  gameId: string;
  _id: string;
  status: string;
  players: {
    _id: string;
    username: string;
  }[];
}

interface User {
  _id: string;
  username: string;
}

interface Invitation {
  _id: string;
  gameId: string;
  inviterId: User;
  inviteeId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { loading, error, data } = useQuery(GET_ME);
  const user = data?.me;

  const { loading: gamesLoading, error: gamesError, data: gamesData } = useQuery(GET_GAMES_IN_PROGRESS_BY_USER, {
    variables: { userId: user?._id },
    skip: !user?._id,
    fetchPolicy: "network-only",
  });

  const { loading: invitationsLoading, error: invitationsError, data: invitationsData } = useQuery(GET_PENDING_INVITATIONS);

  const [logoutUser] = useMutation(LOGOUT_USER);
  const [showForm, setShowForm] = useState(false);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

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

  console.log("🎯 Games Data from GraphQL:", gamesData);


  return (

    
    <div>
      <h1>Welcome, {user?.username}!</h1>

      <button onClick={() => setShowForm(true)}>Add Game</button>

      {showForm && <AddGameForm onClose={() => setShowForm(false)} />}

      {/* Display Active Games */}
      <h2>Your Active Games</h2>
      {gamesLoading && <p>Loading your games...</p>}
      {gamesError && <p>Error loading games: {gamesError.message}</p>
      }

      

      <div className={styles.gameListContainer}>
      {gamesData?.gamesInProgressByUser?.length > 0 ? (
  <div className={styles.gameList}>
    {gamesData.gamesInProgressByUser.map((game: Game) => {
      console.log("🔍 Processing Game Data (before passing to GameCard):", game); // ✅ Log each game object

      return (
        <GameCard
          key={game.gameId || game._id} // ✅ Use gameId or _id
          game={{
            gameId: game.gameId || game._id, // ✅ Use correct field
            status: game.status,
            players: game.players ? game.players.map(player => ({
              userId: String(player._id),
              username: player.username,
            })) : [], // ✅ Ensure players is an array
          }}
          currentUserId={user._id}
        />
      );
    })}
  </div>
) : (
  <p>You are not in any active games.</p>
)}

</div>

      <h2>Pending Invitations</h2>
      {invitationsLoading && <p>Loading invitations...</p>}
      {invitationsError && <p>Error loading invitations: {invitationsError.message}</p>}

      <div className={styles.invitationListContainer}>
        <div className={styles.invitationList}>
          {invitationsData?.getPendingInvitations?.length > 0 ? (
            invitationsData.getPendingInvitations.map((invitation: Invitation) => (
              <InvitationCard key={invitation._id} invitation={invitation} />
            ))
          ) : (
            <p>You have no pending invitations.</p>
          )}
        </div>
      </div>

      {/* Logout Button */}
      <button onClick={handleLogout} style={{ cursor: "pointer", marginTop: "20px" }}>
        Logout
      </button>
    </div>
  );
};

export default Dashboard;

import { useQuery, useMutation } from "@apollo/client";
import { GET_ME } from "../graphql/queries";
import { LOGOUT_USER } from "../graphql/mutations"; // Import logout mutation
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const { loading, error, data } = useQuery(GET_ME);
  const [logoutUser] = useMutation(LOGOUT_USER);

  if (loading) return <p>Loading...</p>;
  if (error) {
    console.error("🚨 Error fetching user data:", error);
    return (
      <div>
        <p>Error loading data. Please try logging in again.</p>
        <button onClick={() => {
          localStorage.removeItem("id_token"); // Clear token on error
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
      await logoutUser(); // Call logout mutation
      localStorage.removeItem("id_token"); // Clear token from storage
      navigate("/login"); // Redirect to login page
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <div>
      <h1>Welcome, {user.username}!</h1>
      <p>Email: {user.email}</p>

      {/* Logout Button */}
      <button onClick={handleLogout} style={{ cursor: "pointer", marginTop: "20px" }}>
        Logout
      </button>
    </div>
  );
};

export default Dashboard;

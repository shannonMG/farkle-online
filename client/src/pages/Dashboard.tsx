import { useQuery } from "@apollo/client";
import { GET_ME } from "../graphql/queries";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const { loading, error, data } = useQuery(GET_ME);

  if (loading) return <p>Loading...</p>;
  if (error) {
    console.error("🚨 Error fetching user data:", error);
    return (
      <div>
        <p>Error loading data. Please try logging in again.</p>
        <button onClick={() => {
          localStorage.removeItem("id_token"); // Clear token on error
          navigate("/");
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
          navigate("/");
        }}>
          Return to Login
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1>Welcome, {user.username}!</h1>
      <p>Email: {user.email}</p>
    </div>
  );
};

export default Dashboard;

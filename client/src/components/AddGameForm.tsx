import React, { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { ADD_GAME } from "../graphql/mutations";
import { GET_USERS } from "../graphql/queries";

interface User {
  _id: string;
  username: string;
}

const AddGameForm = ({ onClose }: { onClose: () => void }) => {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const { data, loading, error } = useQuery(GET_USERS);
  const [addGame, { loading: addGameLoading }] = useMutation(ADD_GAME);

  // Handle selecting multiple users
  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const options = event.target.options;
    const selected: string[] = [];

    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }

    setSelectedPlayers(selected);
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedPlayers.length < 2) {
      alert("Please select at least two players.");
      return;
    }

    try {
      const { data } = await addGame({
        variables: { playerUsernames: selectedPlayers },
      });

      console.log("✅ Game Created:", data.addGame);
      onClose(); // Close the form after creating the game
    } catch (err) {
      console.error("❌ Error creating game:", err);
    }
  };

  if (loading) return <p>Loading users...</p>;
  if (error) return <p>Error loading users: {error.message}</p>;

  return (
    <div className="add-game-form">
      <h2>Create a New Game</h2>
      <form onSubmit={handleSubmit}>
        <label>Select Players:</label>
        <select multiple value={selectedPlayers} onChange={handleSelectChange}>
          {data?.users.map((user: User) => (
            <option key={user._id} value={user.username}>
              {user.username}
            </option>
          ))}
        </select>
        <button type="submit" disabled={addGameLoading}>
          {addGameLoading ? "Creating..." : "Create Game"}
        </button>
        <button type="button" onClick={onClose}>Cancel</button>
      </form>
    </div>
  );
};

export default AddGameForm;

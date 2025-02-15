import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import { CREATE_GAME } from "../graphql/mutations";

interface AddGameFormProps {
  onClose: () => void;
}

const AddGameForm: React.FC<AddGameFormProps> = ({ onClose }) => {
  // Local state for target score (default to 100 or any value you prefer)
  const [targetScore, setTargetScore] = useState<number>(100);

  // Set up the createGame mutation
  const [createGame, { loading: creating }] = useMutation(CREATE_GAME);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const { data } = await createGame({
        variables: {
          input: {
            // Optional: gameId: "customGameId" if you want to override
            targetScore, 
          },
        },
      });
      console.log("✅ Game Created:", data.createGame);
      onClose(); // Close the form after creating the game
    } catch (err) {
      console.error("❌ Error creating game:", err);
    }
  };

  return (
    <div className="add-game-form">
      <h2>Create a New Game</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Target Score:
          <input
            type="number"
            value={targetScore}
            onChange={(e) => setTargetScore(Number(e.target.value))}
          />
        </label>

        <button type="submit" disabled={creating}>
          {creating ? "Creating..." : "Create Game"}
        </button>
        <button type="button" onClick={onClose}>
          Cancel
        </button>
      </form>
    </div>
  );
};

export default AddGameForm;

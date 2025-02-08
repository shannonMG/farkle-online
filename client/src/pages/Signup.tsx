import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import { REGISTER_USER } from "../graphql/mutations";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const navigate = useNavigate();
  const [formState, setFormState] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [register, { loading, error }] = useMutation(REGISTER_USER);

  // Handle input changes
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormState({ ...formState, [name]: value });
  };

  // Handle form submission on button click
  const handleSubmit = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault(); // ✅ Prevent page reload

    try {
      console.log("🚀 Registering user:", formState);

      const { data } = await register({ variables: { ...formState } });

      if (data?.register?.token) {
        console.log("✅ Registration successful! Token:", data.register.token);
        localStorage.setItem("id_token", data.register.token);
        navigate("/me"); // ✅ Redirect after successful registration
      } else {
        console.error("❌ No token received.");
      }
    } catch (err) {
      console.error("❌ Registration failed:", err);
    }
  };

  return (
    <div>
      <h2>Sign Up</h2>
      <form>
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formState.username}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formState.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formState.password}
          onChange={handleChange}
          required
        />
        <button type="submit" onClick={handleSubmit} disabled={loading}>
          {loading ? "Signing Up..." : "Sign Up"}
        </button>
      </form>
      {error && <p style={{ color: "red" }}>Error: {error.message}</p>}
    </div>
  );
};

export default Signup;

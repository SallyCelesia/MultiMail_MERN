import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppContext } from "../AppContext";
import PasswordInput from "../components/PasswordInput";

const API = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const location = useLocation();
  const [message, setMessage] = useState(location.state?.message || "");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useAppContext();

  useEffect(() => {
    if (location.state?.message) showToast(location.state.message);
  }, [location.state, showToast]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.message || "Login failed.";
        setMessage(errorMessage);
        showToast(errorMessage, "error");
        return;
      }

      localStorage.removeItem("token");
      localStorage.setItem("email", data.username);
      showToast("Welcome back!");
      navigate("/dashboard");
    } catch {
      const errorMessage = "Could not connect to the server.";
      setMessage(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleLogin}>
        <Link className="brand auth-brand" to="/login">MultiMail<span>.</span></Link>
        <p className="eyebrow">WELCOME BACK</p>
        <h1>Login to MultiMail</h1>
        <p className="muted">Sign in with the account configured for this app.</p>

        <label htmlFor="username">Username</label>
        <input id="username" type="text" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required />

        <label htmlFor="password">Account password</label>
        <PasswordInput
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Your account password"
          required
          minLength={6}
        />

        <button className="full-button" type="submit" disabled={loading}>{loading ? "Signing in..." : "Login"}</button>
        {message && <p className="feedback" role="status">{message}</p>}
        <p className="auth-switch">Access is limited to the configured account.</p>
      </form>
    </main>
  );
}

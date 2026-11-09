import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../AppContext";
import PasswordInput from "../components/PasswordInput";

const API = import.meta.env.API_BASE_URL || "http://localhost:5000";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useAppContext();
  const passwordRequirements = [
    { label: "At least 6 characters", met: password.length >= 6 },
    { label: "At least one number", met: /\d/.test(password) },
    { label: "At least one symbol", met: /[^A-Za-z0-9\s]/.test(password) }
  ];
  const passwordIsValid = passwordRequirements.every((requirement) => requirement.met);

  const handleSignup = async (event) => {
    event.preventDefault();
    if (!passwordIsValid) {
      const errorMessage = "Meet all password requirements before creating your account.";
      setMessage(errorMessage);
      showToast(errorMessage, "error");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, appPassword })
      });
      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.message || "Registration failed.";
        setMessage(errorMessage);
        showToast(errorMessage, "error");
        return;
      }
      navigate("/login", { state: { message: data.message } });
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
      <form className="auth-card" onSubmit={handleSignup}>
        <Link className="brand auth-brand" to="/login">MultiMail<span>.</span></Link>
        <p className="eyebrow">GET STARTED</p>
        <h1>Create your account</h1>
        <p className="muted">Use your Gmail account to send messages.</p>

        <label htmlFor="email">Gmail address</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@gmail.com" required />

        <label htmlFor="password">Account password</label>
        <PasswordInput
          id="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Create a strong password"
          required
          minLength={6}
        />
        <ul className="password-checklist" aria-label="Password requirements">
          {passwordRequirements.map(({ label, met }) => (
            <li className={met ? "requirement-met" : ""} key={label}>
              <span aria-hidden="true">{met ? "✓" : "○"}</span>
              {label}
            </li>
          ))}
        </ul>

        <label htmlFor="appPassword">Gmail App Password</label>
        <PasswordInput
          id="appPassword"
          value={appPassword}
          onChange={(e) => setAppPassword(e.target.value)}
          placeholder="16-character app password"
          required
        />
        <p className="hint">Use a Google App Password, not your regular Gmail password.</p>

        <button className="full-button" type="submit" disabled={loading}>{loading ? "Creating account..." : "Create account"}</button>
        {message && <p className="feedback">{message}</p>}
        <p className="auth-switch">Already registered? <Link to="/login">Login</Link></p>
      </form>
    </main>
  );
}

import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAppContext } from "../AppContext";

const API = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function Navbar() {
  const navigate = useNavigate();
  const email = localStorage.getItem("email") || "";
  const userName = email.split("@")[0] || "Your account";
  const { theme, toggleTheme, maxDisplayCount, setMaxDisplayCount, showToast } = useAppContext();

  const logout = async () => {
    try {
      const response = await fetch(`${API}/api/auth/logout`, {
        method: "POST",
        credentials: "include"
      });
      if (!response.ok) throw new Error("Logout request failed");
    } catch {
      showToast("Could not log out. Check your connection and try again.", "error");
      return;
    }

    localStorage.removeItem("token");
    localStorage.removeItem("email");
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      <Link className="brand" to="/dashboard">MultiMail<span>.</span></Link>
      <p className="sidebar-caption">YOUR WORKSPACE</p>
      <nav className="sidebar-nav" aria-label="Main navigation">
        <NavLink to="/dashboard"><span aria-hidden="true">✦</span> Compose</NavLink>
        <NavLink to="/history"><span aria-hidden="true">◷</span> Sent history</NavLink>
      </nav>

      <div className="sidebar-footer">
        <section className="settings-panel" aria-label="Settings">
          <p className="settings-title">Settings</p>
          <label className="setting-row" htmlFor="display-count">
            <span>History display</span>
            <select
              id="display-count"
              value={maxDisplayCount}
              onChange={(event) => setMaxDisplayCount(Number(event.target.value))}
            >
              {[5, 10, 20, 50].map((count) => <option key={count} value={count}>{count}</option>)}
            </select>
          </label>
          <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}>
            <span>{theme === "light" ? "Dark appearance" : "Light appearance"}</span>
            <span className={`toggle-track ${theme === "dark" ? "is-dark" : ""}`} aria-hidden="true"><span /></span>
          </button>
        </section>
        <div className="profile-row">
          <div className="profile-avatar" aria-hidden="true">{userName.charAt(0).toUpperCase()}</div>
          <div className="profile-info">
            <strong title={email}>{userName}</strong>
            <span title={email}>{email}</span>
          </div>
          <button className="logout-button" type="button" onClick={logout}>Log out</button>
        </div>
      </div>
    </aside>
  );
}

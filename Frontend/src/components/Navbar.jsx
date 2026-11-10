import { Link, NavLink } from "react-router-dom";
import { useAppContext } from "../AppContext";

export default function Navbar() {
  const { theme, toggleTheme, maxDisplayCount, setMaxDisplayCount } = useAppContext();

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
      </div>
    </aside>
  );
}

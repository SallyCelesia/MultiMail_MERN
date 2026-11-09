import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import MailCard from "../components/MailCard";
import { useAppContext } from "../AppContext";

const API = import.meta.env.VITE_API_BASE_URL || "https://multimail-mern.onrender.com";

export default function History() {
  const [mails, setMails] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { maxDisplayCount, showToast } = useAppContext();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`${API}/api/mail/history`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        const data = await response.json();

        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("email");
          navigate("/login");
          return;
        }
        if (!response.ok) {
          const errorMessage = data.message || "Unable to fetch history.";
          setMessage(errorMessage);
          showToast(errorMessage, "error");
          return;
        }
        setMails(data);
      } catch {
        const errorMessage = "Could not connect to the server.";
        setMessage(errorMessage);
        showToast(errorMessage, "error");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [navigate, showToast]);

  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main page-content">
        <div className="history-heading">
          <div>
            <p className="eyebrow">YOUR RECORDS</p>
            <h1>Sent mail history</h1>
            <p className="muted">Review your previous bulk email activity.</p>
          </div>
          <Link className="button-link" to="/dashboard">Compose email</Link>
        </div>

        {loading && <p className="muted">Loading history...</p>}
        {message && <p className="feedback">{message}</p>}
        {!loading && !message && mails.length === 0 && (
          <div className="empty-state">No emails sent yet.</div>
        )}
        <div className="history-list">
          {mails.slice(0, maxDisplayCount).map((mail) => <MailCard key={mail._id} mail={mail} />)}
          {!loading && !message && mails.length > maxDisplayCount && (
            <p className="history-count">Showing {maxDisplayCount} of {mails.length} campaigns. Change the limit in Settings.</p>
          )}
        </div>
      </main>
    </div>
  );
}

import { useState } from "react";
import RecipientUpload from "./RecipientUpload";
import { useAppContext } from "../AppContext";

const API = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function ComposeMail() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [recipients, setRecipients] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useAppContext();

  const handleSend = async (event) => {
    event.preventDefault();

    if (!recipients.length) {
      const errorMessage = "Upload an Excel file containing valid recipient emails.";
      setMessage(errorMessage);
      showToast(errorMessage, "error");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API}/api/mail/send`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ subject, body, recipients })
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.message || "Unable to send emails.";
        setMessage(errorMessage);
        showToast(errorMessage, "error");
        return;
      }

      const resultMessage = `Completed — sent: ${data.sent}, failed: ${data.failed}, total: ${data.total}.`;
      setMessage(resultMessage);
      showToast(resultMessage, data.failed > 0 ? "error" : "success");
      setSubject("");
      setBody("");
      setRecipients([]);
      const fileInput = document.getElementById("recipient-file");
      if (fileInput) fileInput.value = "";
    } catch {
      const errorMessage = "Could not connect to the server.";
      setMessage(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel compose-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">NEW CAMPAIGN</p>
          <h1>Compose email</h1>
          <p className="muted">Prepare your message and upload recipients.</p>
        </div>
      </div>

      <form onSubmit={handleSend}>
        <RecipientUpload recipients={recipients} setRecipients={setRecipients} />

        <label htmlFor="subject">Subject</label>
        <input
          id="subject"
          type="text"
          placeholder="Enter email subject"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          required
        />

        <label htmlFor="body">Email body</label>
        <textarea
          id="body"
          placeholder="Write your message here..."
          value={body}
          onChange={(event) => setBody(event.target.value)}
          required
        />

        <div className="send-row">
          <span className="muted">{recipients.length} recipient(s)</span>
          <button type="submit" disabled={loading}>
            {loading ? `Sending to ${recipients.length}...` : "Send bulk email"}
          </button>
        </div>

        {loading && (
          <p className="muted" role="status">
            Sending to {recipients.length} recipients. This may take a while.
          </p>
        )}
        {message && <p className="feedback" role="status">{message}</p>}
      </form>
    </section>
  );
}

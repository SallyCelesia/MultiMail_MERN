export default function MailCard({ mail }) {
  const sent = mail.recipients.filter((recipient) => recipient.status === "sent").length;
  const failed = mail.recipients.filter((recipient) => recipient.status === "failed").length;

  return (
    <article className="mail-card">
      <div className="mail-card-top">
        <h3>{mail.subject}</h3>
        <span className={`status status-${mail.status}`}>{mail.status}</span>
      </div>
      <p className="mail-body">{mail.body}</p>
      <div className="mail-stats">
        <span>Total: {mail.recipients.length}</span>
        <span>Sent: {sent}</span>
        <span>Failed: {failed}</span>
      </div>
      <details>
        <summary>View recipient details</summary>
        <ul className="recipient-list">
          {mail.recipients.map((recipient, index) => (
            <li key={`${recipient.email}-${index}`}>
              <span>{recipient.email}</span>
              <span className={`status status-${recipient.status}`}>{recipient.status}</span>
              {recipient.error && <small>{recipient.error}</small>}
            </li>
          ))}
        </ul>
      </details>
      <small className="muted">{new Date(mail.createdAt).toLocaleString()}</small>
    </article>
  );
}

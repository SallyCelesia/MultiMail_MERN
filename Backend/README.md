# Backend

The Express API uses MongoDB Atlas for accounts, bcrypt for password hashing,
JWTs for authentication, and Nodemailer for delivery. Configure MongoDB and JWT
values from `.env.example` in your local `.env` before starting:

```powershell
npm start
```

Signup, login, and `/api/auth/me` are documented in the root README. All mail
routes require a bearer JWT. After login, `POST /smtp/session` accepts the
user's Gmail app password and verifies it against the authenticated account's
email address. The password is not stored in MongoDB or browser storage; the
backend holds the Nodemailer transporter in memory only. `POST /logout`
revokes the login token and clears its SMTP session unless pending scheduled
messages still need it. `POST /send` accepts `recipients` (an array of
email addresses), `subject`, `message`, and `confirmedOptIn: true`. There is no
configured recipient-count or hourly send cap. Addresses are validated and
deduplicated; each recipient gets an individual message.

`POST /schedule` accepts the same message fields plus a future `scheduledAt`
ISO date. Pending schedules are persisted in the ignored `data/` directory,
sent by the backend at the requested time, and moved to the sent folder.
`GET /messages` returns the current user's scheduled and sent messages.
`PATCH /messages/:id/star` persists a star update. Keep the backend running for
automatic delivery. Scheduled mail requires the backend to remain running;
SMTP sessions are lost on restart, so schedules dependent on them will fail if
the server restarts before delivery.

Set `FRONTEND_ORIGIN` to the frontend origin, or a comma-separated list of
origins, when it differs from `http://localhost:5173`. The server binds to
`127.0.0.1` by default; add authentication before binding it to a public
interface. MongoDB stores accounts; message metadata is stored in the ignored
local `data/mail-queue.json` file. Never deploy without HTTPS, since the app
password is sent to the backend for verification.

# MultiMail deployment

Deploy `Frontend` and `Backend` as separate Vercel projects. Set each project's
**Root Directory** to its respective folder; their existing `vercel.json`
files configure the frontend SPA and the backend Express function.

## Backend environment

Configure these values in the backend Vercel project's environment settings:

- `NODE_ENV=production`
- `PORT` — optional locally; Vercel supplies the function port.
- `MONGODB_URI` — MongoDB connection string.
- `CLIENT_ORIGIN` — exact frontend origin; comma-separated origins are allowed.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` — SMTP
  server settings. Use `true` for implicit TLS (usually port 465), or `false`
  for STARTTLS (usually port 587).
- `MAIL_FROM` — sender accepted by your SMTP provider, e.g.
  `MultiMail <mail@your-verified-domain.com>`.
- `MAX_CAMPAIGN_RECIPIENTS` — optional integer from 1 to 100 (default 100).

The mail API has no login or authentication. Anyone able to reach it can submit
campaigns, view shared mail history, and use the configured SMTP sender. Keep
the API private or deploy it behind network-level access controls if it should
not be public; `CLIENT_ORIGIN` limits browser origins but is not authentication.

Campaigns are sent using Nodemailer with a connection pool and per-recipient
delivery status in MongoDB. Vercel Functions have a finite execution duration,
so keep campaign sizes appropriate for your SMTP provider and Vercel plan.
SMTP egress also depends on Vercel's network and the provider: test the deployed
function with the SMTP test script. If the SMTP connection times out or the
provider port is blocked, SMTP cannot work from that Vercel deployment; use a
provider-supported reachable port or deploy the backend on a host that allows
SMTP egress.

## Frontend environment

Set `VITE_API_URL` to the backend deployment origin, without a trailing slash,
for example `https://your-api.vercel.app`. Locally it defaults to
`http://localhost:5000`.

For separate Vercel origins, configure `CLIENT_ORIGIN` with the frontend origin.

## Local development and SMTP test

Copy `Backend/.env.example` to `Backend/.env` and
`Frontend/.env.example` to `Frontend/.env`, fill in your private values, and
run each package's existing `dev` script. Never commit real `.env` files or
expose backend secrets as `VITE_` variables.

To check SMTP credentials and send a single test email, run this from
`Backend`:

```sh
npm run test:smtp -- you@example.com
```

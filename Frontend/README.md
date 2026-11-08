# Frontend

The React application includes signup/login, XLSX recipient import, composition,
send/schedule, drafts, message folders, and settings. See the project root
`README.md` for the available UI actions, API endpoints, database setup, and
local run instructions.

The source is organized by responsibility:

- `src/components/layout/` contains the sidebar and mobile header.
- `src/components/views/` contains the composer and message-folder views.
- `src/components/overlays/` contains settings and toast UI.
- `src/components/ui/` contains shared UI primitives.
- `src/services/` contains frontend API clients.
- `src/store/` contains the Zustand application state.
- `src/App.jsx` composes the application layout and active view.

Run `npm run dev` to start the frontend, `npm run lint` to check the code, and
`npm run build` to create a production build. Set `VITE_API_BASE_URL` in
`.env` only if the backend is not at `http://127.0.0.1:5000`.
import Navbar from "../components/Navbar";
import ComposeMail from "../components/ComposeMail";

export default function Dashboard() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main page-content">
        <ComposeMail />
      </main>
    </div>
  );
}

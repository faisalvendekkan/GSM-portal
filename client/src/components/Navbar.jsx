import { LogOut, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Button from "./Button.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-navy-950/80 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <Link to={user?.role === "admin" ? "/admin" : "/dashboard"} className="flex min-w-0 items-center gap-3">
          <img
            src="/brand/gsm-logo.svg"
            alt="GSM Student Portal"
            className="h-10 w-10 shrink-0 rounded-lg shadow-glow ring-1 ring-electric-400/35"
          />
          <div className="min-w-0">
            <p className="truncate text-sm text-slate-400">GSM</p>
            <h1 className="truncate text-base font-semibold text-white sm:text-lg">Student Portal</h1>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/profile"
            className="hidden min-h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.08] px-3 text-sm text-slate-200 transition hover:bg-white/[0.12] sm:flex"
          >
            <UserRound size={17} />
            <span className="max-w-40 truncate">{user?.name}</span>
          </Link>
          <Button variant="ghost" icon={LogOut} onClick={handleLogout} aria-label="Logout">
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

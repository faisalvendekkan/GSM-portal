import {
  Bot,
  FileText,
  Gauge,
  Layers3,
  Link as LinkIcon,
  Newspaper,
  ShieldCheck,
  UsersRound,
  UserRound
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const studentLinks = [
  { to: "/dashboard", label: "Dashboard", icon: Gauge },
  { to: "/ai", label: "AI Assistant", icon: Bot },
  { to: "/notes", label: "Notes", icon: FileText },
  { to: "/links", label: "Saved Links", icon: LinkIcon },
  { to: "/articles", label: "Articles", icon: Newspaper },
  { to: "/profile", label: "Profile", icon: UserRound }
];

const adminLinks = [
  { to: "/admin", label: "Admin", icon: ShieldCheck },
  { to: "/admin/users", label: "Users", icon: UsersRound },
  { to: "/admin/categories", label: "Categories", icon: Layers3 },
  { to: "/admin/articles", label: "Articles", icon: Newspaper }
];

export default function Sidebar() {
  const { isAdmin } = useAuth();
  const links = isAdmin ? [...studentLinks, ...adminLinks] : studentLinks;

  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-screen w-72 border-r border-white/10 bg-navy-950/90 p-5 backdrop-blur-xl lg:block">
      <div className="mb-8 flex items-center gap-3">
        <img
          src="/brand/gsm-logo.svg"
          alt="GSM Student Portal"
          className="h-11 w-11 rounded-lg shadow-glow ring-1 ring-electric-400/35"
        />
        <div>
          <p className="text-sm text-slate-400">GSM Student</p>
          <h2 className="font-semibold text-white">Portal</h2>
        </div>
      </div>
      <nav className="space-y-1">
        {links.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/dashboard" || item.to === "/admin"}
            className={({ isActive }) =>
              `flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${
                isActive ? "bg-electric-500 text-white shadow-glow" : "text-slate-300 hover:bg-white/[0.08] hover:text-white"
              }`
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

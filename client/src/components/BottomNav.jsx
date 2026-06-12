import { Bot, FileText, Gauge, Link as LinkIcon, Newspaper } from "lucide-react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/dashboard", label: "Home", icon: Gauge },
  { to: "/ai", label: "AI", icon: Bot },
  { to: "/notes", label: "Notes", icon: FileText },
  { to: "/links", label: "Links", icon: LinkIcon },
  { to: "/articles", label: "Articles", icon: Newspaper }
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-navy-950/90 px-2 py-2 backdrop-blur-xl lg:hidden">
      <div className="grid grid-cols-5 gap-1">
        {links.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-xs transition ${
                isActive ? "bg-electric-500 text-white" : "text-slate-400 hover:bg-white/[0.08] hover:text-white"
              }`
            }
          >
            <item.icon size={19} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

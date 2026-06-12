import { Outlet } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import Navbar from "../components/Navbar.jsx";
import Sidebar from "../components/Sidebar.jsx";

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-navy-950 text-slate-100">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(27,140,255,0.18),transparent_34%),linear-gradient(135deg,#06111f_0%,#0a1728_48%,#071b2f_100%)]" />
      <Sidebar />
      <div className="min-h-screen pb-24 lg:pl-72 lg:pb-0">
        <Navbar />
        <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

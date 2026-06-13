import { Outlet } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import Navbar from "../components/Navbar.jsx";
import Sidebar from "../components/Sidebar.jsx";

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-navy-950 text-slate-100">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(0,183,47,0.2),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(0,104,145,0.16),transparent_38%),linear-gradient(135deg,#07120c_0%,#0b1a18_48%,#0f2c28_100%)]" />
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

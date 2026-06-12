import { ArrowRight, Bot, LockKeyhole, NotebookText, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../components/Button.jsx";

export default function Landing() {
  return (
    <div className="min-h-screen bg-navy-950 text-white">
      <section className="relative min-h-[92vh] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80"
          alt="Circuit board repair bench"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-950/[0.82] to-navy-950/[0.35]" />
        <div className="relative mx-auto flex min-h-[92vh] max-w-7xl flex-col justify-center px-5 py-14 sm:px-8">
          <div className="max-w-3xl">
            <p className="mb-4 inline-flex rounded-lg border border-electric-400/40 bg-electric-500/[0.12] px-3 py-2 text-sm text-cyan-100">
              Technician training workspace
            </p>
            <h1 className="text-4xl font-bold leading-tight sm:text-6xl">Mobile Repair AI Student Portal</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
              Learn, save repair knowledge, ask guided diagnostic questions, and manage field notes from one secure portal.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/login">
                <Button icon={ArrowRight} className="w-full sm:w-auto">
                  Student Login
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="secondary" className="w-full sm:w-auto">
                  Create Account
                </Button>
              </Link>
              <Link to="/admin/login">
                <Button variant="ghost" icon={ShieldCheck} className="w-full sm:w-auto">
                  Admin
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 py-8 sm:grid-cols-3 sm:px-8">
        {[
          { icon: Bot, title: "AI Repair Help", text: "Step-by-step guidance for safe diagnosis." },
          { icon: NotebookText, title: "Notes and Links", text: "Keep repair references organized by category." },
          { icon: LockKeyhole, title: "Secure Portal", text: "JWT auth, refresh tokens, and role access." }
        ].map((item) => (
          <div key={item.title} className="glass-card">
            <item.icon className="mb-4 text-electric-400" size={28} />
            <h2 className="font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">{item.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

import { LockKeyhole, Mail } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import Input from "../components/Input.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getApiMessage } from "../utils/helpers.js";

export default function Login({ adminMode = false }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminLogin = adminMode || location.pathname.includes("/admin");

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await login(form.email, form.password, isAdminLogin);
      navigate(user.role === "admin" ? "/admin" : location.state?.from?.pathname || "/dashboard", { replace: true });
    } catch (err) {
      setError(getApiMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-navy-950 px-4 py-8 text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(0,183,47,0.22),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(0,104,145,0.16),transparent_40%),linear-gradient(135deg,#07120c,#0f2c28)]" />
      <Card className="w-full max-w-md">
        <div className="mb-7 flex items-center gap-3">
          <img
            src="/brand/gsm-logo.jpeg"
            alt="GSM Student Portal"
            className="h-12 w-12 rounded-lg bg-white object-contain p-1 shadow-glow ring-1 ring-electric-400/35"
          />
          <div>
            <p className="text-sm text-electric-400">{isAdminLogin ? "Admin access" : "Student access"}</p>
            <h1 className="mt-1 text-2xl font-bold">Sign in</h1>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={(event) => update("password", event.target.value)}
            required
          />
          {error ? <div className="rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</div> : null}
          <Button type="submit" icon={isAdminLogin ? LockKeyhole : Mail} disabled={submitting} className="w-full">
            {submitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300">
          <Link className="hover:text-white" to={isAdminLogin ? "/login" : "/admin/login"}>
            {isAdminLogin ? "Student login" : "Admin login"}
          </Link>
        </div>
      </Card>
    </div>
  );
}

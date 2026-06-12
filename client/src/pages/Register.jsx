import { UserPlus } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import Input from "../components/Input.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getApiMessage } from "../utils/helpers.js";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(form);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(getApiMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-navy-950 px-4 py-8 text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(27,140,255,0.24),transparent_36%),linear-gradient(135deg,#06111f,#10243a)]" />
      <Card className="w-full max-w-lg">
        <div className="mb-7">
          <p className="text-sm text-electric-400">Student registration</p>
          <h1 className="mt-2 text-2xl font-bold">Create your account</h1>
        </div>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <Input label="Name" value={form.name} onChange={(event) => update("name", event.target.value)} required />
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
            autoComplete="new-password"
            value={form.password}
            onChange={(event) => update("password", event.target.value)}
            required
          />
          <Input
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={(event) => update("confirmPassword", event.target.value)}
            required
          />
          {error ? <div className="rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</div> : null}
          <Button type="submit" icon={UserPlus} disabled={submitting} className="w-full">
            {submitting ? "Creating..." : "Create Account"}
          </Button>
        </form>
        <p className="mt-6 text-sm text-slate-300">
          Already registered?{" "}
          <Link className="text-electric-400 hover:text-electric-300" to="/login">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}

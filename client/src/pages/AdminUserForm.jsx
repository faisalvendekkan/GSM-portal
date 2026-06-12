import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios.js";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import Input from "../components/Input.jsx";
import Loader from "../components/Loader.jsx";
import Toast from "../components/Toast.jsx";
import { getApiMessage } from "../utils/helpers.js";

const emptyForm = {
  fullName: "",
  email: "",
  phone: "",
  role: "student",
  status: "active",
  password: "",
  confirmPassword: ""
};

export default function AdminUserForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const editing = Boolean(id);

  useEffect(() => {
    if (!id) return;
    api
      .get(`/admin/users/${id}`)
      .then(({ data }) =>
        setForm({
          fullName: data.user.full_name,
          email: data.user.email,
          phone: data.user.phone || "",
          role: data.user.role,
          status: data.user.status,
          password: "",
          confirmPassword: ""
        })
      )
      .catch((error) => setToast({ type: "error", message: getApiMessage(error) }))
      .finally(() => setLoading(false));
  }, [id]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setToast(null);
    try {
      if (editing) {
        await api.put(`/admin/users/${id}`, {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          role: form.role,
          status: form.status
        });
      } else {
        await api.post("/admin/users", form);
      }
      navigate("/admin/users", { state: { toast: editing ? "User updated." : "User created." } });
    } catch (error) {
      setToast({ type: "error", message: getApiMessage(error) });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loader label="Loading user" />;

  return (
    <Card className="mx-auto max-w-3xl">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <h2 className="mb-6 text-2xl font-bold">{editing ? "Edit User" : "Add User"}</h2>
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        <Input label="Full name" value={form.fullName} onChange={(event) => update("fullName", event.target.value)} required />
        <Input label="Email" type="email" value={form.email} onChange={(event) => update("email", event.target.value)} required />
        <Input label="Phone" value={form.phone} onChange={(event) => update("phone", event.target.value)} />
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-200">Role</span>
          <select
            value={form.role}
            onChange={(event) => update("role", event.target.value)}
            className="min-h-11 w-full rounded-lg border border-white/10 bg-navy-900/80 px-3 text-sm text-slate-100 outline-none focus:border-electric-400"
          >
            <option value="student">Student</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-200">Status</span>
          <select
            value={form.status}
            onChange={(event) => update("status", event.target.value)}
            className="min-h-11 w-full rounded-lg border border-white/10 bg-navy-900/80 px-3 text-sm text-slate-100 outline-none focus:border-electric-400"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </label>
        {!editing ? (
          <>
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={(event) => update("password", event.target.value)}
              required
            />
            <div>
              <Input
                label="Confirm password"
                type="password"
                value={form.confirmPassword}
                onChange={(event) => update("confirmPassword", event.target.value)}
                required
              />
              <p className="mt-2 text-xs leading-5 text-slate-400">
                Password needs uppercase, lowercase, number, and symbol.
              </p>
            </div>
          </>
        ) : null}
        <div className="flex gap-2 md:col-span-2">
          <Button type="submit" icon={Save} disabled={saving}>
            {saving ? "Saving..." : "Save User"}
          </Button>
          <Button variant="secondary" onClick={() => navigate("/admin/users")}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

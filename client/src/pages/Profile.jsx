import { Save, UserRound } from "lucide-react";
import { useState } from "react";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import Input from "../components/Input.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getApiMessage } from "../utils/helpers.js";

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ name: user?.name || "", phone: user?.phone || "", bio: user?.bio || "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await updateProfile(form);
      setMessage("Profile saved.");
    } catch (err) {
      setError(getApiMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-electric-500">
          <UserRound />
        </div>
        <div>
          <p className="text-sm text-slate-400">{user?.email}</p>
          <h2 className="text-2xl font-bold">Profile</h2>
        </div>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <Input label="Name" value={form.name} onChange={(event) => update("name", event.target.value)} required />
        <Input label="Phone" value={form.phone} onChange={(event) => update("phone", event.target.value)} />
        <Input as="textarea" rows={5} label="Bio" value={form.bio} onChange={(event) => update("bio", event.target.value)} />
        {message ? <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">{message}</div> : null}
        {error ? <div className="rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</div> : null}
        <Button type="submit" icon={Save} disabled={saving}>
          {saving ? "Saving..." : "Save Profile"}
        </Button>
      </form>
    </Card>
  );
}

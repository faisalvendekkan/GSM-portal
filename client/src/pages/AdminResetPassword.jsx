import { KeyRound } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios.js";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import Input from "../components/Input.jsx";
import Toast from "../components/Toast.jsx";
import { getApiMessage } from "../utils/helpers.js";

export default function AdminResetPassword() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toast, setToast] = useState(null);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function resetPassword() {
    setSaving(true);
    setToast(null);
    try {
      await api.patch(`/admin/users/${id}/reset-password`, form);
      navigate(`/admin/users/${id}`, { replace: true });
    } catch (error) {
      setToast({ type: "error", message: getApiMessage(error) });
      setConfirmOpen(false);
    } finally {
      setSaving(false);
    }
  }

  function submit(event) {
    event.preventDefault();
    setConfirmOpen(true);
  }

  return (
    <Card className="mx-auto max-w-xl">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <ConfirmDialog
        open={confirmOpen}
        title="Reset password"
        message="Reset this user's password? Their old password will stop working immediately."
        confirmLabel={saving ? "Resetting..." : "Reset Password"}
        danger
        onConfirm={resetPassword}
        onCancel={() => setConfirmOpen(false)}
      />
      <div className="mb-6">
        <p className="text-sm text-electric-400">Admin action</p>
        <h2 className="mt-1 flex items-center gap-2 text-2xl font-bold">
          <KeyRound />
          Reset Password
        </h2>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <Input
          label="New password"
          type="password"
          value={form.password}
          onChange={(event) => update("password", event.target.value)}
          required
        />
        <Input
          label="Confirm password"
          type="password"
          value={form.confirmPassword}
          onChange={(event) => update("confirmPassword", event.target.value)}
          required
        />
        <div className="flex gap-2">
          <Button type="submit" icon={KeyRound} disabled={saving}>
            Reset Password
          </Button>
          <Button variant="secondary" onClick={() => navigate(`/admin/users/${id}`)}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

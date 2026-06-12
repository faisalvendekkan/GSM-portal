import { ArrowLeft, Edit3, KeyRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios.js";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import Loader from "../components/Loader.jsx";
import { RoleBadge, StatusBadge } from "../components/UserBadges.jsx";
import { formatDate, getApiMessage } from "../utils/helpers.js";

export default function AdminUserDetail() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/admin/users/${id}`)
      .then(({ data }) => {
        setUser(data.user);
        setAuditLogs(data.auditLogs || []);
      })
      .catch((err) => setError(getApiMessage(err)));
  }, [id]);

  if (error) return <Card>{error}</Card>;
  if (!user) return <Loader label="Loading user details" />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <Link to="/admin/users">
          <Button variant="ghost" icon={ArrowLeft}>
            Users
          </Button>
        </Link>
        <div className="flex gap-2">
          <Link to={`/admin/users/${user.id}/edit`}>
            <Button variant="secondary" icon={Edit3}>
              Edit
            </Button>
          </Link>
          <Link to={`/admin/users/${user.id}/reset-password`}>
            <Button icon={KeyRound}>Reset Password</Button>
          </Link>
        </div>
      </div>

      <Card>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <p className="text-sm text-electric-400">User details</p>
            <h2 className="mt-1 text-2xl font-bold">{user.full_name}</h2>
            <p className="mt-1 text-slate-400">{user.email}</p>
          </div>
          <div className="flex gap-2">
            <RoleBadge role={user.role} />
            <StatusBadge status={user.status} />
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-slate-400">Notes</p>
            <p className="mt-2 text-2xl font-bold">{user.total_notes}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-slate-400">Saved Links</p>
            <p className="mt-2 text-2xl font-bold">{user.total_saved_links}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-slate-400">AI Chats</p>
            <p className="mt-2 text-2xl font-bold">{user.total_ai_chats}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-slate-400">Last Login</p>
            <p className="mt-2 text-sm font-semibold">{user.last_login_at ? formatDate(user.last_login_at) : "Never"}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <p>
            <span className="text-slate-400">Phone:</span> {user.phone || "-"}
          </p>
          <p>
            <span className="text-slate-400">Created:</span> {formatDate(user.created_at)}
          </p>
          <p>
            <span className="text-slate-400">Updated:</span> {formatDate(user.updated_at)}
          </p>
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 font-semibold">Audit Log</h3>
        <div className="space-y-3">
          {auditLogs.map((log) => (
            <div key={log.id} className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="flex flex-col justify-between gap-2 sm:flex-row">
                <p className="font-medium">{log.action.replaceAll("_", " ")}</p>
                <p className="text-xs text-slate-400">{formatDate(log.created_at)}</p>
              </div>
              <p className="mt-1 text-sm text-slate-400">
                By {log.admin_full_name || log.admin_name || log.admin_email || "Deleted admin"}
              </p>
            </div>
          ))}
          {!auditLogs.length ? <p className="text-sm text-slate-400">No audit entries yet.</p> : null}
        </div>
      </Card>
    </div>
  );
}

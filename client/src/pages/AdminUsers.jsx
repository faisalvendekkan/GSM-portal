import { Edit3, Eye, KeyRound, Plus, Power, Search, Trash2, UserRoundCog } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import Input from "../components/Input.jsx";
import Loader from "../components/Loader.jsx";
import Toast from "../components/Toast.jsx";
import { RoleBadge, StatusBadge } from "../components/UserBadges.jsx";
import { formatDate, getApiMessage } from "../utils/helpers.js";

const filters = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
  { value: "admin", label: "Admin" },
  { value: "student", label: "Student" }
];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.toast) {
      setToast({ type: "success", message: location.state.toast });
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate]);

  async function load(page = 1) {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/users", { params: { search, filter, page, limit: 10 } });
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (error) {
      setToast({ type: "error", message: getApiMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
  }, [filter]);

  function submitSearch(event) {
    event.preventDefault();
    load(1);
  }

  function askDelete(user) {
    setConfirm({
      title: "Delete user",
      message: `Delete ${user.full_name}? This removes their notes, saved links, chats, and refresh sessions.`,
      confirmLabel: "Delete",
      danger: true,
      onConfirm: async () => {
        try {
          await api.delete(`/admin/users/${user.id}`);
          setToast({ type: "success", message: "User deleted." });
          setConfirm(null);
          load(pagination.page);
        } catch (error) {
          setToast({ type: "error", message: getApiMessage(error) });
          setConfirm(null);
        }
      }
    });
  }

  function askToggleStatus(user) {
    const nextStatus = user.status === "active" ? "inactive" : "active";
    setConfirm({
      title: `${nextStatus === "active" ? "Activate" : "Deactivate"} user`,
      message: `${nextStatus === "active" ? "Activate" : "Deactivate"} ${user.full_name}?`,
      confirmLabel: nextStatus === "active" ? "Activate" : "Deactivate",
      danger: nextStatus !== "active",
      onConfirm: async () => {
        try {
          await api.patch(`/admin/users/${user.id}/status`, { status: nextStatus });
          setToast({ type: "success", message: "User status updated." });
          setConfirm(null);
          load(pagination.page);
        } catch (error) {
          setToast({ type: "error", message: getApiMessage(error) });
          setConfirm(null);
        }
      }
    });
  }

  return (
    <div className="space-y-5">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <ConfirmDialog open={Boolean(confirm)} {...confirm} onCancel={() => setConfirm(null)} />

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-electric-400">Admin control</p>
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <UserRoundCog />
            Users
          </h2>
        </div>
        <Link to="/admin/users/new">
          <Button icon={Plus} className="w-full sm:w-auto">
            Add User
          </Button>
        </Link>
      </div>

      <Card>
        <form onSubmit={submitSearch} className="grid gap-3 lg:grid-cols-[1fr_220px_auto]">
          <Input placeholder="Search by name, email, phone, or role" value={search} onChange={(event) => setSearch(event.target.value)} />
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="min-h-11 rounded-lg border border-white/10 bg-navy-900/80 px-3 text-sm text-slate-100 outline-none focus:border-electric-400"
          >
            {filters.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <Button type="submit" icon={Search}>
            Search
          </Button>
        </form>
      </Card>

      <Card>
        {loading ? <Loader label="Loading users" /> : null}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="py-3">User</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Activity</th>
                <th>Last Login</th>
                <th className="w-64">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="py-3">
                    <p className="font-medium text-white">{user.full_name}</p>
                    <p className="text-xs text-slate-400">{user.email}</p>
                  </td>
                  <td>{user.phone || "-"}</td>
                  <td>
                    <RoleBadge role={user.role} />
                  </td>
                  <td>
                    <StatusBadge status={user.status} />
                  </td>
                  <td className="text-xs text-slate-300">
                    <span>{user.total_notes} notes</span>
                    <span className="mx-2 text-slate-600">/</span>
                    <span>{user.total_saved_links} links</span>
                    <span className="mx-2 text-slate-600">/</span>
                    <span>{user.total_ai_chats} chats</span>
                  </td>
                  <td>{user.last_login_at ? formatDate(user.last_login_at) : "Never"}</td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <Link to={`/admin/users/${user.id}`}>
                        <Button variant="secondary" icon={Eye} aria-label="View user" />
                      </Link>
                      <Link to={`/admin/users/${user.id}/edit`}>
                        <Button variant="secondary" icon={Edit3} aria-label="Edit user" />
                      </Link>
                      <Link to={`/admin/users/${user.id}/reset-password`}>
                        <Button variant="secondary" icon={KeyRound} aria-label="Reset password" />
                      </Link>
                      <Button variant="secondary" icon={Power} onClick={() => askToggleStatus(user)} aria-label="Change status" />
                      <Button variant="danger" icon={Trash2} onClick={() => askDelete(user)} aria-label="Delete user" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && !users.length ? <p className="py-6 text-center text-sm text-slate-400">No users found.</p> : null}
        <div className="mt-5 flex flex-col justify-between gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center">
          <p className="text-sm text-slate-400">
            Page {pagination.page} of {pagination.totalPages} / {pagination.total} users
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={pagination.page <= 1} onClick={() => load(pagination.page - 1)}>
              Previous
            </Button>
            <Button variant="secondary" disabled={pagination.page >= pagination.totalPages} onClick={() => load(pagination.page + 1)}>
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

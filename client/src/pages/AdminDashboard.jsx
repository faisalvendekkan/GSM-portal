import { Bot, FileText, Link as LinkIcon, Newspaper, Tags, Users } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../api/axios.js";
import Card from "../components/Card.jsx";
import Loader from "../components/Loader.jsx";
import { formatDate, getApiMessage } from "../utils/helpers.js";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.get("/admin/stats"), api.get("/admin/students")])
      .then(([statsResponse, studentsResponse]) => {
        setStats(statsResponse.data.stats);
        setStudents(studentsResponse.data.students);
      })
      .catch((err) => setError(getApiMessage(err)));
  }, []);

  if (error) return <Card>{error}</Card>;
  if (!stats) return <Loader label="Loading admin dashboard" />;

  const cards = [
    { label: "Students", value: stats.students, icon: Users },
    { label: "Notes", value: stats.notes, icon: FileText },
    { label: "Saved Links", value: stats.links, icon: LinkIcon },
    { label: "AI Chats", value: stats.aiChats, icon: Bot },
    { label: "Articles", value: stats.articles, icon: Newspaper },
    { label: "Categories", value: stats.categories, icon: Tags }
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-electric-400">Admin control</p>
        <h2 className="text-2xl font-bold">Dashboard</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.label}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">{card.label}</p>
                <p className="mt-2 text-3xl font-bold">{card.value}</p>
              </div>
              <card.icon className="text-electric-400" size={28} />
            </div>
          </Card>
        ))}
      </div>
      <Card>
        <h3 className="mb-4 font-semibold">Students</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="py-3">Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {students.map((student) => (
                <tr key={student.id}>
                  <td className="py-3 font-medium">{student.name}</td>
                  <td>{student.email}</td>
                  <td>{student.phone || "-"}</td>
                  <td>{formatDate(student.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

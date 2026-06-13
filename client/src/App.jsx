import { Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import AIAssistant from "./pages/AIAssistant.jsx";
import Notes from "./pages/Notes.jsx";
import NoteForm from "./pages/NoteForm.jsx";
import Links from "./pages/Links.jsx";
import LinkForm from "./pages/LinkForm.jsx";
import Articles from "./pages/Articles.jsx";
import ArticleDetail from "./pages/ArticleDetail.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminCategories from "./pages/AdminCategories.jsx";
import AdminArticles from "./pages/AdminArticles.jsx";
import AdminUsers from "./pages/AdminUsers.jsx";
import AdminUserForm from "./pages/AdminUserForm.jsx";
import AdminUserDetail from "./pages/AdminUserDetail.jsx";
import AdminResetPassword from "./pages/AdminResetPassword.jsx";
import Profile from "./pages/Profile.jsx";
import ErrorPage from "./pages/Error.jsx";
import NotFound from "./pages/NotFound.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin/login" element={<Login adminMode />} />
      <Route path="/register" element={<Navigate to="/login" replace />} />
      <Route path="/error" element={<ErrorPage />} />

      <Route element={<ProtectedRoute roles={["student", "admin"]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/ai" element={<AIAssistant />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/notes/new" element={<NoteForm />} />
          <Route path="/notes/:id/edit" element={<NoteForm />} />
          <Route path="/links" element={<Links />} />
          <Route path="/links/new" element={<LinkForm />} />
          <Route path="/links/:id/edit" element={<LinkForm />} />
          <Route path="/articles" element={<Articles />} />
          <Route path="/articles/:slug" element={<ArticleDetail />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={["admin"]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/users/new" element={<AdminUserForm />} />
          <Route path="/admin/users/:id" element={<AdminUserDetail />} />
          <Route path="/admin/users/:id/edit" element={<AdminUserForm />} />
          <Route path="/admin/users/:id/reset-password" element={<AdminResetPassword />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/articles" element={<AdminArticles />} />
        </Route>
      </Route>

      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<NotFound />} />
      <Route path="/app" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

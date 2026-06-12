import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api, { clearAccessToken, setAccessToken } from "../api/axios.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function boot() {
      try {
        const { data } = await api.post("/auth/refresh");
        setAccessToken(data.accessToken);
        if (mounted) setUser(data.user);
      } catch (error) {
        clearAccessToken();
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    boot();
    return () => {
      mounted = false;
    };
  }, []);

  async function login(email, password, adminMode = false) {
    const endpoint = adminMode ? "/auth/admin/login" : "/auth/login";
    const { data } = await api.post(endpoint, { email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }

  async function register(payload) {
    const { data } = await api.post("/auth/register", payload);
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      clearAccessToken();
      setUser(null);
    }
  }

  async function updateProfile(payload) {
    const { data } = await api.put("/auth/profile", payload);
    setUser(data.user);
    return data.user;
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      updateProfile,
      isAdmin: user?.role === "admin"
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

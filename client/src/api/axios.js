import axios from "axios";

let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function clearAccessToken() {
  accessToken = null;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true
});

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const authUrl = original?.url || "";

    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !authUrl.includes("/auth/login") &&
      !authUrl.includes("/auth/admin/login") &&
      !authUrl.includes("/auth/refresh")
    ) {
      original._retry = true;
      try {
        const { data } = await api.post("/auth/refresh");
        setAccessToken(data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (refreshError) {
        clearAccessToken();
      }
    }

    return Promise.reject(error);
  }
);

export default api;

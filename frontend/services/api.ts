import axios from "axios";

const ip= process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1";
const port = process.env.NEXT_PUBLIC_API_PORT || 3001;

const api = axios.create({
  baseURL: `${ip}:${port}/api/`,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;

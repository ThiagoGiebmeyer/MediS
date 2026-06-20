import axios from "axios";

const defaultHost = "http://127.0.0.1";
const defaultPort = "3001";

const buildBaseUrl = () => {
  const rawHost = (process.env.NEXT_PUBLIC_API_URL || defaultHost).trim();
  const rawPort = (process.env.NEXT_PUBLIC_API_PORT || defaultPort).toString().trim();

  const hasProtocol = /^https?:\/\//i.test(rawHost);
  const hostWithProtocol = hasProtocol ? rawHost : `http://${rawHost}`;

  try {
    const url = new URL(hostWithProtocol);

    if (!url.port) {
      url.port = rawPort;
    }

    return `${url.origin}/api/`;
  } catch {
    return `${defaultHost}:${defaultPort}/api/`;
  }
};

const api = axios.create({
  baseURL: buildBaseUrl(),
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

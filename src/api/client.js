import axios from "axios";
import { auth } from "../firebase";

const rawBaseUrl =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:4360";
const BASE_URL = rawBaseUrl.replace(/\/+$/, "");

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  if (config.data instanceof FormData && config.headers) {
    delete config.headers["Content-Type"];
  }
  if (auth?.currentUser) {
    const token = await auth.currentUser.getIdToken();
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

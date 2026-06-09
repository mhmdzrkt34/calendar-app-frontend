import axios from "axios";
import { getToken, removeToken } from "./Helpers";

const BASE = import.meta.env.VITE_BACKEND_URL + "/api";

export const publicAxios = axios.create({
  baseURL: BASE,
  headers: { "Content-Type": "application/json" },
});

export const authAxios = axios.create({
  baseURL: BASE,
  headers: { "Content-Type": "application/json" },
});

authAxios.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

authAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeToken();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

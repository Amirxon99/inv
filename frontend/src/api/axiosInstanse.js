// src/api/axiosInstanse.js
import axios from "axios";
import { store } from "../store";
import { logoutLocal } from "../store/slices/authSlice";

const BASE_URL = "/api";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

let onAuthFail = null;
export const setOnAuthFail = (cb) => {
  onAuthFail = cb;
};

/* ===== Request Interceptor ===== */
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token && !config.url.includes("/auth/login") && !config.url.includes("/refresh")) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers["Content-Type"] = "application/json";
  const lang = localStorage.getItem("lang") || "uz";
  config.headers["Accept-Language"] = lang;
  return config;
});

/* ===== Response Interceptor ===== */
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response) return Promise.reject(error);
    const originalRequest = error.config;

    // Access token muddati tugadi
    if (error.response.status === 401 && !originalRequest._retry && !originalRequest.url.includes("/auth/login")) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) throw new Error("No refresh token");

        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });

        localStorage.setItem("access_token", data.accessToken);
        localStorage.setItem("refresh_token", data.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return axiosInstance(originalRequest);
      } catch (err) {
        store.dispatch(logoutLocal());
        if (onAuthFail) onAuthFail();
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const loginRequest = (email, password) => {
  return api.post("/auth/login", { email, password });
};

export const registerRequest = (name, email, password) => {
  return api.post("/auth/register", { name, email, password });
};

export const fetchProfileRequest = () => {
  return api.get("/auth/profile");
};

export const fetchNearbyUsersRequest = (radiusKm = 5) => {
  return api.get("/location/nearby", { params: { radius: radiusKm } });
};

export const updateLocationRequest = (latitude, longitude) => {
  return api.put("/location/update", { latitude, longitude });
};

export default api;
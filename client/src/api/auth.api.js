import api from "./api";

export const loginApi = async (data) => {
  const response = await api.post("/api/auth/login", data);
  return response.data;
};

export const registerApi = async (data) => {
  const response = await api.post("/api/auth/register", data);
  return response.data;
};

export const getMeApi = async () => {
  const response = await api.get("/api/auth/me");
  return response.data;
};

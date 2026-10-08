import api from "./api";

export const getFoodsApi = async () => {
  const res = await api.get("/api/foods");
  return res.data;
};

export const getCategoriesApi = async () => {
  const res = await api.get("/api/categories");
  return res.data;
};

export const createFoodApi = async (formData) => {
  const res = await api.post("/api/foods", formData);
  return res.data;
};

export const updateFoodApi = async (foodId, formData) => {
  const res = await api.put(
    `/api/foods/${foodId}`,
    formData
  );

  return res.data;
};

export const deleteFoodApi = async (foodId) => {
  const res = await api.delete(`/api/foods/${foodId}`);
  return res.data;
};

export const updateFoodAvailabilityApi = async (
  foodId,
  isAvailable
) => {
  const res = await api.patch(
    `/api/foods/${foodId}/availability`,
    { isAvailable }
  );

  return res.data;
};
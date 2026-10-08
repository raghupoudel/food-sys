import api from "./api";

export const getCategoriesApi = async () => {
  const response = await api.get(
    "/api/categories"
  );

  return response.data;
};


export const createCategoryApi = async (
  formData
) => {
  const response = await api.post(
    "/api/categories",
    formData
  );

  return response.data;
};


export const updateCategoryApi = async (
  categoryId,
  formData
) => {
  const response = await api.put(
    `/api/categories/${categoryId}`,
    formData
  );

  return response.data;
};


export const deleteCategoryApi = async (
  categoryId
) => {
  const response = await api.delete(
    `/api/categories/${categoryId}`
  );

  return response.data;
};
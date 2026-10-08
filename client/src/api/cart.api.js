import api from "./api";

export const getCart = async () => {
  const response = await api.get("/api/cart");
  return response.data;
};

export const addToCart = async (foodId, quantity = 1) => {
  const response = await api.post("/api/cart/items", {
    foodId,
    quantity,
  });

  return response.data;
};

export const updateCartItem = async (foodId, quantity) => {
  const response = await api.put(`/api/cart/items/${foodId}`, {
    quantity,
  });

  return response.data;
};

export const removeFromCart = async (foodId) => {
  const response = await api.delete(
    `/api/cart/items/${foodId}`
  );

  return response.data;
};

export const clearCart = async () => {
  const response = await api.delete("/api/cart");

  return response.data;
};
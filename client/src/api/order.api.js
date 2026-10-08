import api from "./api";


// =====================================================
// CUSTOMER
// =====================================================

export const createOrderApi = async (data) => {
  const response = await api.post(
    "/api/orders",
    data
  );

  return response.data;
};


export const getOrdersApi = async () => {
  const response = await api.get(
    "/api/orders"
  );

  return response.data;
};


export const getOrderApi = async (orderId) => {
  const response = await api.get(
    `/api/orders/${orderId}`
  );

  return response.data;
};


export const updateCustomerOrderApi = async (
  orderId,
  data
) => {
  const response = await api.patch(
    `/api/orders/${orderId}`,
    data
  );

  return response.data;
};


export const cancelOrderApi = async (
  orderId
) => {
  const response = await api.delete(
    `/api/orders/${orderId}`
  );

  return response.data;
};


// =====================================================
// ADMIN
// =====================================================

export const getAllOrdersAdminApi = async () => {
  const response = await api.get(
    "/api/orders/admin/all"
  );

  return response.data;
};


export const getAdminOrderApi = async (
  orderId
) => {
  const response = await api.get(
    `/api/orders/admin/${orderId}`
  );

  return response.data;
};


export const updateAdminOrderApi = async (
  orderId,
  data
) => {
  const response = await api.patch(
    `/api/orders/admin/${orderId}`,
    data
  );

  return response.data;
};
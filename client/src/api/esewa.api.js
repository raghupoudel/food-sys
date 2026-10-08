import axios from "axios";

const API_URL = "http://localhost:5000/api";

export const initiateEsewaPaymentApi = async (
  orderId
) => {
  const token = localStorage.getItem("token");

  const response = await axios.post(
    `${API_URL}/esewa/initiate`,
    {
      orderId,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

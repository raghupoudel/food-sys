import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getOrdersApi } from "../api/order.api";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await getOrdersApi();

      setOrders(response.data?.orders || []);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Failed to load orders"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <h2 style={{ padding: "40px" }}>Loading orders...</h2>;
  }

  return (
    <main style={{ padding: "40px" }}>
      <h1>My Orders</h1>

      {error && (
        <p style={{ color: "red" }}>
          {error}
        </p>
      )}

      {orders.length === 0 ? (
        <div>
          <p>You have no orders yet.</p>

          <Link to="/foods">
            Browse Foods
          </Link>
        </div>
      ) : (
        <div style={{ marginTop: "25px" }}>
          {orders.map((order) => (
            <div
              key={order._id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "10px",
                padding: "20px",
                marginBottom: "20px",
              }}
            >
              <h3>
                Order #{order._id}
              </h3>

              <p>
                <strong>Total:</strong> Rs.{" "}
                {order.totalAmount}
              </p>

              <p>
                <strong>Payment:</strong>{" "}
                {order.paymentMethod}
              </p>

              <p>
                <strong>Payment Status:</strong>{" "}
                {order.paymentStatus}
              </p>

              <p>
                <strong>Order Status:</strong>{" "}
                {order.orderStatus}
              </p>

              <p>
                <strong>Delivery Address:</strong>{" "}
                {order.deliveryAddress}
              </p>

              <p>
                <strong>Items:</strong>{" "}
                {order.items?.length || 0}
              </p>

              <Link to={`/orders/${order._id}`}>
                View Order Details
              </Link>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

export default Orders;

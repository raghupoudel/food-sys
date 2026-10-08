import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getOrderApi,
  cancelOrderApi,
} from "../api/order.api";

function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getOrderApi(id);

      setOrder(response.data?.order || null);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Failed to load order"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this order?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setCancelling(true);
      setError("");
      setMessage("");

      const response = await cancelOrderApi(id);

      setOrder(response.data?.order || order);

      setMessage(
        response.message ||
          "Order cancelled successfully"
      );
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Failed to cancel order"
      );
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <main style={{ padding: "40px" }}>
        <h2>Loading order...</h2>
      </main>
    );
  }

  if (error && !order) {
    return (
      <main style={{ padding: "40px" }}>
        <h2>Order Details</h2>

        <p style={{ color: "red" }}>
          {error}
        </p>

        <Link to="/orders">
          Back to Orders
        </Link>
      </main>
    );
  }

  if (!order) {
    return (
      <main style={{ padding: "40px" }}>
        <h2>Order not found</h2>

        <Link to="/orders">
          Back to Orders
        </Link>
      </main>
    );
  }

  const canCancel =
    order.orderStatus === "PENDING";

  return (
    <main style={{ padding: "40px", maxWidth: "900px" }}>
      <Link to="/orders">
        ← Back to Orders
      </Link>

      <h1 style={{ marginTop: "20px" }}>
        Order Details
      </h1>

      {message && (
        <p style={{ color: "green" }}>
          {message}
        </p>
      )}

      {error && (
        <p style={{ color: "red" }}>
          {error}
        </p>
      )}

      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: "10px",
          padding: "20px",
          marginTop: "20px",
        }}
      >
        <h2>
          Order #{order._id}
        </h2>

        <p>
          <strong>Order Status:</strong>{" "}
          {order.orderStatus}
        </p>

        <p>
          <strong>Payment Method:</strong>{" "}
          {order.paymentMethod}
        </p>

        <p>
          <strong>Payment Status:</strong>{" "}
          {order.paymentStatus}
        </p>

        <p>
          <strong>Delivery Address:</strong>{" "}
          {order.deliveryAddress}
        </p>

        <p>
          <strong>Order Date:</strong>{" "}
          {new Date(order.createdAt).toLocaleString()}
        </p>
      </section>

      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: "10px",
          padding: "20px",
          marginTop: "20px",
        }}
      >
        <h2>Items</h2>

        {order.items.map((item, index) => (
          <div
            key={item.food?._id || index}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "15px 0",
              borderBottom: "1px solid #eee",
            }}
          >
            <div>
              <strong>{item.name}</strong>

              <p style={{ margin: "5px 0" }}>
                Rs. {item.price} × {item.quantity}
              </p>
            </div>

            <strong>
              Rs. {item.subtotal}
            </strong>
          </div>
        ))}

        <div
          style={{
            textAlign: "right",
            marginTop: "20px",
          }}
        >
          <p>
            Subtotal: Rs. {order.subtotal}
          </p>

          <p>
            Delivery Fee: Rs. {order.deliveryFee}
          </p>

          <h2>
            Total: Rs. {order.totalAmount}
          </h2>
        </div>
      </section>

      {canCancel && (
        <button
          onClick={handleCancelOrder}
          disabled={cancelling}
          style={{
            marginTop: "20px",
            padding: "12px 20px",
          }}
        >
          {cancelling
            ? "Cancelling..."
            : "Cancel Order"}
        </button>
      )}
    </main>
  );
}

export default OrderDetails;
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCart } from "../api/cart.api";
import { createOrderApi } from "../api/order.api";
import {
  initiateEsewaPaymentApi,
} from "../api/esewa.api";


function Checkout() {
  const navigate = useNavigate();

  const [cart, setCart] = useState(null);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");

  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const response = await getCart();

      setCart(response.data?.cart || null);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
        "Failed to load cart"
      );
    } finally {
      setLoading(false);
    }
  };

  const submitEsewaPayment = (
    paymentUrl,
    paymentData
  ) => {
    const form = document.createElement("form");

    form.method = "POST";
    form.action = paymentUrl;

    Object.entries(paymentData).forEach(
      ([key, value]) => {
        const input =
          document.createElement("input");

        input.type = "hidden";
        input.name = key;
        input.value = value;

        form.appendChild(input);
      }
    );

    document.body.appendChild(form);

    form.submit();
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    setError("");

    if (!deliveryAddress.trim()) {
      setError("Delivery address is required");
      return;
    }

    if (deliveryAddress.trim().length < 5) {
      setError(
        "Delivery address must be at least 5 characters"
      );
      return;
    }

    if (!cart?.items?.length) {
      setError("Your cart is empty");
      return;
    }

    try {
      setPlacingOrder(true);

      const response = await createOrderApi({
        deliveryAddress: deliveryAddress.trim(),
        paymentMethod,
      });

      const orderId = response.data?.order?._id;

      if (!orderId) {
        throw new Error("Order ID was not returned");
      }

      if (paymentMethod === "ESEWA") {
        const paymentResponse =
          await initiateEsewaPaymentApi(orderId);

        const paymentUrl =
          paymentResponse.data?.paymentUrl;

        const paymentData =
          paymentResponse.data?.paymentData;

        if (!paymentUrl || !paymentData) {
          throw new Error(
            "eSewa payment information was not returned"
          );
        }

        submitEsewaPayment(
          paymentUrl,
          paymentData
        );

        return;
      }

      navigate(`/orders/${orderId}`);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to place order"
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <main style={{ padding: "40px" }}>
        <h2>Loading checkout...</h2>
      </main>
    );
  }

  if (error && !cart) {
    return (
      <main style={{ padding: "40px" }}>
        <h2>Checkout</h2>

        <p style={{ color: "red" }}>
          {error}
        </p>
      </main>
    );
  }

  if (!cart?.items?.length) {
    return (
      <main style={{ padding: "40px" }}>
        <h1>Checkout</h1>

        <p>Your cart is empty.</p>

        <button onClick={() => navigate("/foods")}>
          Browse Foods
        </button>
      </main>
    );
  }

  return (
    <main
      style={{
        padding: "40px",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <h1>Checkout</h1>

      {error && (
        <p
          style={{
            color: "red",
            background: "#ffecec",
            padding: "10px",
            borderRadius: "6px",
          }}
        >
          {error}
        </p>
      )}

      {/* ORDER SUMMARY */}
      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: "10px",
          padding: "20px",
          marginTop: "20px",
        }}
      >
        <h2>Order Summary</h2>

        {cart.items.map((item) => (
          <div
            key={item.food._id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 0",
              borderBottom: "1px solid #eee",
            }}
          >
            <span>
              {item.food.name} × {item.quantity}
            </span>

            <strong>
              Rs. {item.price * item.quantity}
            </strong>
          </div>
        ))}

        <h3
          style={{
            textAlign: "right",
            marginTop: "20px",
          }}
        >
          Total: Rs. {cart.subtotal}
        </h3>
      </section>

      {/* CHECKOUT FORM */}
      <form
        onSubmit={handlePlaceOrder}
        style={{
          marginTop: "30px",
          border: "1px solid #ddd",
          borderRadius: "10px",
          padding: "20px",
        }}
      >
        <h2>Delivery Details</h2>

        {/* DELIVERY ADDRESS */}
        <div style={{ marginBottom: "20px" }}>
          <label
            htmlFor="deliveryAddress"
            style={{
              display: "block",
              fontWeight: "bold",
            }}
          >
            Delivery Address
          </label>

          <textarea
            id="deliveryAddress"
            value={deliveryAddress}
            onChange={(e) =>
              setDeliveryAddress(e.target.value)
            }
            placeholder="Enter your delivery address"
            rows="4"
            required
            style={{
              display: "block",
              width: "100%",
              marginTop: "8px",
              padding: "10px",
              boxSizing: "border-box",
              resize: "vertical",
            }}
          />
        </div>

        {/* PAYMENT METHOD */}
        <div style={{ marginBottom: "20px" }}>
          <label
            htmlFor="paymentMethod"
            style={{
              display: "block",
              fontWeight: "bold",
            }}
          >
            Payment Method
          </label>

          <select
            id="paymentMethod"
            value={paymentMethod}
            onChange={(e) =>
              setPaymentMethod(e.target.value)
            }
            style={{
              display: "block",
              marginTop: "8px",
              padding: "10px",
              width: "100%",
            }}
          >
            <option value="COD">
              Cash on Delivery
            </option>

            <option value="ESEWA">
              eSewa
            </option>

            <option value="KHALTI">
              Khalti
            </option>
          </select>
        </div>

        {/* PAYMENT INFORMATION */}
        <div
          style={{
            marginBottom: "20px",
            padding: "12px",
            background: "#f5f5f5",
            borderRadius: "6px",
          }}
        >
          {paymentMethod === "COD" && (
            <p style={{ margin: 0 }}>
              💵 You will pay when your order is
              delivered.
            </p>
          )}

          {paymentMethod === "ESEWA" && (
            <p style={{ margin: 0 }}>
              You selected eSewa. Payment gateway
              processing will be required after
              placing the order.
            </p>
          )}

          {paymentMethod === "KHALTI" && (
            <p style={{ margin: 0 }}>
              You selected Khalti. Payment gateway
              processing will be required after
              placing the order.
            </p>
          )}
        </div>

        {/* PLACE ORDER */}
        <button
          type="submit"
          disabled={placingOrder}
          style={{
            padding: "12px 20px",
            cursor: placingOrder
              ? "not-allowed"
              : "pointer",
            width: "100%",
          }}
        >
          {placingOrder
            ? "Placing Order..."
            : `Place Order - Rs. ${cart.subtotal}`}
        </button>
      </form>
    </main>
  );
}

export default Checkout;

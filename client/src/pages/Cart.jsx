import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../api/cart.api";

function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const loadCart = async () => {
    try {
      setLoading(true);
      setError("");

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

  useEffect(() => {
    loadCart();
  }, []);

  const handleQuantityChange = async (foodId, quantity) => {
    try {
      if (quantity < 1) {
        await removeFromCart(foodId);
      } else {
        const response = await updateCartItem(
          foodId,
          quantity
        );

        setCart(response.data?.cart);
      }

      await loadCart();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Failed to update cart"
      );
    }
  };

  const handleRemove = async (foodId) => {
    try {
      setError("");

      await removeFromCart(foodId);

      await loadCart();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Failed to remove item"
      );
    }
  };

  const handleClear = async () => {
    try {
      setError("");

      await clearCart();

      await loadCart();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Failed to clear cart"
      );
    }
  };

  if (loading) {
    return (
      <main style={{ padding: "40px" }}>
        <h1>Shopping Cart</h1>
        <p>Loading cart...</p>
      </main>
    );
  }

  if (error && !cart) {
    return (
      <main style={{ padding: "40px" }}>
        <h1>Shopping Cart</h1>
        <p style={{ color: "red" }}>{error}</p>
      </main>
    );
  }

  const items = cart?.items || [];

  return (
    <main style={{ padding: "40px", maxWidth: "1000px", margin: "auto" }}>
      <h1>Shopping Cart</h1>

      {error && (
        <p style={{ color: "red" }}>
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <div>
          <p>Your cart is empty.</p>

          <Link to="/foods">
            Browse Foods
          </Link>
        </div>
      ) : (
        <>
          <div>
            {items.map((item) => (
              <div
                key={item.food._id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "20px",
                  padding: "20px 0",
                  borderBottom: "1px solid #ddd",
                }}
              >
                {item.food.image && (
                  <img
                    src={item.food.image}
                    alt={item.food.name}
                    style={{
                      width: "100px",
                      height: "80px",
                      objectFit: "cover",
                      borderRadius: "8px",
                    }}
                  />
                )}

                <div style={{ flex: 1 }}>
                  <h3>{item.food.name}</h3>

                  <p>
                    Price: Rs. {item.price}
                  </p>

                  <div>
                    <button
                      onClick={() =>
                        handleQuantityChange(
                          item.food._id,
                          item.quantity - 1
                        )
                      }
                    >
                      -
                    </button>

                    <span
                      style={{
                        margin: "0 15px",
                        fontWeight: "bold",
                      }}
                    >
                      {item.quantity}
                    </span>

                    <button
                      onClick={() =>
                        handleQuantityChange(
                          item.food._id,
                          item.quantity + 1
                        )
                      }
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <strong>
                    Rs. {item.price * item.quantity}
                  </strong>

                  <br />

                  <button
                    onClick={() =>
                      handleRemove(item.food._id)
                    }
                    style={{ marginTop: "10px" }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "30px" }}>
            <h2>
              Subtotal: Rs. {cart?.subtotal || 0}
            </h2>

            <button onClick={handleClear}>
              Clear Cart
            </button>

            <button
              onClick={() => navigate("/checkout")}
              style={{ marginLeft: "15px" }}
            >
              Checkout
            </button>
          </div>
        </>
      )}
    </main>
  );
}

export default Cart;
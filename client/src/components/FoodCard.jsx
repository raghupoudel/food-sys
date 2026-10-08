import { useState } from "react";
import { addToCart } from "../api/cart.api";

function FoodCard({ food }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleAddToCart = async () => {
    console.log("ADD TO CART CLICKED");
    console.log("Food:", food);

    if (!food?._id) {
      setError("Food ID is missing");
      console.error("Food ID is missing:", food);
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setError("");

      console.log("Sending cart request for:", food._id);

      const response = await addToCart(food._id, 1);

      console.log("Cart API response:", response);

      setMessage("Added to cart ✓");
    } catch (err) {
      console.error("ADD TO CART ERROR:", err);

      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to add food to cart"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="food-card">

      {food.image ? (
        <img
          src={food.image}
          alt={food.name}
          className="food-image"
        />
      ) : (
        <div className="food-image no-image">
          No Image
        </div>
      )}

      <h2>{food.name}</h2>

      <p>
        {food.description}
      </p>

      <strong>
        Rs. {food.price}
      </strong>

      <p>
        {food.preparationTime} min
      </p>

      <p>
        {food.isVegetarian
          ? "🌱 Vegetarian"
          : "🍗 Non-Vegetarian"}
      </p>

      <button
        type="button"
        onClick={handleAddToCart}
        disabled={loading || food.isAvailable === false}
      >
        {loading
          ? "Adding..."
          : food.isAvailable === false
            ? "Unavailable"
            : "Add to Cart"}
      </button>

      {message && (
        <p style={{ color: "green", marginTop: "10px" }}>
          {message}
        </p>
      )}

      {error && (
        <p style={{ color: "red", marginTop: "10px" }}>
          {error}
        </p>
      )}

    </div>
  );
}

export default FoodCard;
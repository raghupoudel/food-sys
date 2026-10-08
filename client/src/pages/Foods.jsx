import { useEffect, useState } from "react";
import { getFoodsApi } from "../api/food.api";
import { addToCart } from "../api/cart.api";
import FoodCard from "../components/FoodCard";

function Foods() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadFoods();
  }, []);

  const loadFoods = async () => {
    try {
      const response = await getFoodsApi();

      setFoods(response.data?.foods || []);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
        "Failed to load foods"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (foodId) => {
    try {
      setError("");

      await addToCart(foodId, 1);

      setMessage("Food added to cart");

      setTimeout(() => {
        setMessage("");
      }, 2000);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
        "Failed to add food to cart"
      );
    }
  };

  if (loading) {
    return <h2 style={{ padding: "40px" }}>Loading...</h2>;
  }

  return (
    <main style={{ padding: "40px" }}>
      <h1>Our Foods</h1>

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {foods.map((food) => (
          <FoodCard
            key={food._id}
            food={food}
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>
    </main>
  );
}

export default Foods;

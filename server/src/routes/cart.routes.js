const express = require("express");

const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} = require("../controllers/cart.controller");

const protect = require("../middleware/auth.middleware");

const router = express.Router();

// Get user's cart
router.get("/", protect, getCart);

// Add food to cart
router.post("/items", protect, addToCart);

// Update cart item quantity
router.put("/items/:foodId", protect, updateCartItem);

// Remove item from cart
router.delete("/items/:foodId", protect, removeFromCart);

// Clear entire cart
router.delete("/", protect, clearCart);

module.exports = router;
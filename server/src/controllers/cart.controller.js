const mongoose = require("mongoose");

const Cart = require("../models/Cart");
const Food = require("../models/Food");

const calculateSubtotal = (items) => {
  return items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);
};

// GET /api/cart
const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({
      user: req.user.id,
    }).populate(
      "items.food",
      "name price image isAvailable preparationTime"
    );

    if (!cart) {
      return res.status(200).json({
        success: true,
        data: {
          cart: {
            items: [],
            subtotal: 0,
          },
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        cart,
      },
    });
  } catch (error) {
    console.error("Get cart error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// POST /api/cart/items
const addToCart = async (req, res) => {
  try {
    const { foodId, quantity } = req.body;

    if (!foodId || !mongoose.Types.ObjectId.isValid(foodId)) {
      return res.status(400).json({
        success: false,
        message: "Valid foodId is required",
      });
    }

    const parsedQuantity = Number(quantity);

    if (
      !Number.isInteger(parsedQuantity) ||
      parsedQuantity < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer",
      });
    }

    const food = await Food.findById(foodId);

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Food not found",
      });
    }

    if (!food.isAvailable) {
      return res.status(400).json({
        success: false,
        message: "Food is currently unavailable",
      });
    }

    let cart = await Cart.findOne({
      user: req.user.id,
    });

    if (!cart) {
      cart = new Cart({
        user: req.user.id,
        items: [],
      });
    }

    const existingItem = cart.items.find(
      (item) => item.food.toString() === foodId
    );

    if (existingItem) {
      existingItem.quantity += parsedQuantity;
      existingItem.price = food.price;
    } else {
      cart.items.push({
        food: food._id,
        quantity: parsedQuantity,
        price: food.price,
      });
    }

    cart.subtotal = calculateSubtotal(cart.items);

    await cart.save();

    await cart.populate(
      "items.food",
      "name price image isAvailable preparationTime"
    );

    return res.status(200).json({
      success: true,
      message: "Food added to cart",
      data: {
        cart,
      },
    });
  } catch (error) {
    console.error("Add to cart error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// PUT /api/cart/items/:foodId
const updateCartItem = async (req, res) => {
  try {
    const { foodId } = req.params;
    const { quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(foodId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid food ID",
      });
    }

    const parsedQuantity = Number(quantity);

    if (
      !Number.isInteger(parsedQuantity) ||
      parsedQuantity < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer",
      });
    }

    const food = await Food.findById(foodId);

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Food not found",
      });
    }

    if (!food.isAvailable) {
      return res.status(400).json({
        success: false,
        message: "Food is currently unavailable",
      });
    }

    const cart = await Cart.findOne({
      user: req.user.id,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const item = cart.items.find(
      (item) => item.food.toString() === foodId
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Food is not in the cart",
      });
    }

    item.quantity = parsedQuantity;
    item.price = food.price;

    cart.subtotal = calculateSubtotal(cart.items);

    await cart.save();

    await cart.populate(
      "items.food",
      "name price image isAvailable preparationTime"
    );

    return res.status(200).json({
      success: true,
      message: "Cart item updated",
      data: {
        cart,
      },
    });
  } catch (error) {
    console.error("Update cart item error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// DELETE /api/cart/items/:foodId
const removeFromCart = async (req, res) => {
  try {
    const { foodId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(foodId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid food ID",
      });
    }

    const cart = await Cart.findOne({
      user: req.user.id,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const originalLength = cart.items.length;

    cart.items = cart.items.filter(
      (item) => item.food.toString() !== foodId
    );

    if (cart.items.length === originalLength) {
      return res.status(404).json({
        success: false,
        message: "Food is not in the cart",
      });
    }

    cart.subtotal = calculateSubtotal(cart.items);

    await cart.save();

    await cart.populate(
      "items.food",
      "name price image isAvailable preparationTime"
    );

    return res.status(200).json({
      success: true,
      message: "Food removed from cart",
      data: {
        cart,
      },
    });
  } catch (error) {
    console.error("Remove from cart error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// DELETE /api/cart
const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({
      user: req.user.id,
    });

    if (!cart) {
      return res.status(200).json({
        success: true,
        message: "Cart is already empty",
      });
    }

    cart.items = [];
    cart.subtotal = 0;

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      data: {
        cart,
      },
    });
  } catch (error) {
    console.error("Clear cart error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};

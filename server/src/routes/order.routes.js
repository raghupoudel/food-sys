const express = require("express");

const {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  getAdminOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  updateAdminOrder,
  updateCustomerOrder,
} = require("../controllers/order.controller");

const protect = require("../middleware/auth.middleware");
const adminOnly = require("../middleware/admin.middleware");

const router = express.Router();

// =====================================================
// ADMIN ROUTES
// =====================================================

// Get all orders
router.get(
  "/admin/all",
  protect,
  adminOnly,
  getAllOrders
);

// Get single order
router.get(
  "/admin/:id",
  protect,
  adminOnly,
  getAdminOrderById
);

// Full admin order edit
router.patch(
  "/admin/:id",
  protect,
  adminOnly,
  updateAdminOrder
);

// Update order status
router.patch(
  "/admin/:id/status",
  protect,
  adminOnly,
  updateOrderStatus
);

// Update payment status
router.patch(
  "/admin/:id/payment-status",
  protect,
  adminOnly,
  updatePaymentStatus
);

// =====================================================
// CUSTOMER ROUTES
// =====================================================

// Create order
router.post(
  "/",
  protect,
  createOrder
);

// Get customer's orders
router.get(
  "/",
  protect,
  getMyOrders
);

// Get customer's single order
router.get(
  "/:id",
  protect,
  getOrderById
);

// Customer can edit order while pending
router.patch(
  "/:id",
  protect,
  updateCustomerOrder
);

// Cancel order
router.delete(
  "/:id",
  protect,
  cancelOrder
);

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;
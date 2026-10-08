const mongoose = require("mongoose");

const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Food = require("../models/Food");

/*
|--------------------------------------------------------------------------
| CREATE ORDER
|--------------------------------------------------------------------------
| POST /api/orders
*/
const createOrder = async (req, res) => {
  try {
    const {
      deliveryAddress,
      paymentMethod = "COD",
    } = req.body;

    if (
      !deliveryAddress ||
      typeof deliveryAddress !== "string" ||
      deliveryAddress.trim().length < 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid delivery address is required",
      });
    }

    const allowedPaymentMethods = [
      "COD",
      "ESEWA",
      "KHALTI",
    ];

    if (!allowedPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    const cart = await Cart.findOne({
      user: req.user.id,
    }).populate(
      "items.food",
      "name price isAvailable"
    );

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    for (const item of cart.items) {
      if (!item.food) {
        return res.status(400).json({
          success: false,
          message:
            "One or more foods in the cart no longer exist",
        });
      }

      if (!item.food.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `${item.food.name} is currently unavailable`,
        });
      }
    }

    const orderItems = cart.items.map((item) => ({
      food: item.food._id,
      name: item.food.name,
      price: item.food.price,
      quantity: item.quantity,
      subtotal: item.food.price * item.quantity,
    }));

    const subtotal = orderItems.reduce(
      (total, item) => total + item.subtotal,
      0
    );

    const deliveryFee = 0;
    const totalAmount = subtotal + deliveryFee;

    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      subtotal,
      deliveryFee,
      totalAmount,
      deliveryAddress: deliveryAddress.trim(),
      paymentMethod,
      paymentStatus: "PENDING",
      orderStatus: "PENDING",
    });

    cart.items = [];
    cart.subtotal = 0;

    await cart.save();

    await order.populate(
      "user",
      "name email phone"
    );

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: {
        order,
      },
    });
  } catch (error) {
    console.error("Create order error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


/*
|--------------------------------------------------------------------------
| GET CUSTOMER ORDERS
|--------------------------------------------------------------------------
| GET /api/orders
*/
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user.id,
    })
      .populate("items.food", "name image")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        orders,
      },
    });
  } catch (error) {
    console.error("Get orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


/*
|--------------------------------------------------------------------------
| GET CUSTOMER SINGLE ORDER
|--------------------------------------------------------------------------
| GET /api/orders/:id
*/
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findOne({
      _id: id,
      user: req.user.id,
    })
      .populate("user", "name email phone")
      .populate("items.food", "name image");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        order,
      },
    });
  } catch (error) {
    console.error("Get order error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


/*
|--------------------------------------------------------------------------
| CUSTOMER UPDATE ORDER
|--------------------------------------------------------------------------
| PATCH /api/orders/:id
|
| Customer can ONLY edit:
| - deliveryAddress
| - items
|
| Only while orderStatus === PENDING
*/
const updateCustomerOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      deliveryAddress,
      items,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findOne({
      _id: id,
      user: req.user.id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    /*
     * Customer can edit ONLY pending orders.
     */
    if (order.orderStatus !== "PENDING") {
      return res.status(400).json({
        success: false,
        message:
          "Order can only be edited while it is pending",
      });
    }

    /*
     * Customer cannot change payment method,
     * payment status, or order status.
     */
    const forbiddenFields = [
      "paymentMethod",
      "paymentStatus",
      "orderStatus",
    ];

    for (const field of forbiddenFields) {
      if (req.body[field] !== undefined) {
        return res.status(403).json({
          success: false,
          message:
            "Customers cannot modify payment or order status",
        });
      }
    }

    /*
     * Update delivery address
     */
    if (deliveryAddress !== undefined) {
      if (
        typeof deliveryAddress !== "string" ||
        deliveryAddress.trim().length < 5
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Delivery address must be at least 5 characters",
        });
      }

      if (deliveryAddress.trim().length > 300) {
        return res.status(400).json({
          success: false,
          message:
            "Delivery address cannot exceed 300 characters",
        });
      }

      order.deliveryAddress =
        deliveryAddress.trim();
    }

    /*
     * Update ordered items
     */
    if (items !== undefined) {
      if (!Array.isArray(items)) {
        return res.status(400).json({
          success: false,
          message: "Items must be an array",
        });
      }

      if (items.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "Order must contain at least one item",
        });
      }

      const foodIds = items.map(
        (item) => item.food
      );

      for (const foodId of foodIds) {
        if (
          !mongoose.Types.ObjectId.isValid(foodId)
        ) {
          return res.status(400).json({
            success: false,
            message:
              `Invalid food ID: ${foodId}`,
          });
        }
      }

      const foods = await Food.find({
        _id: { $in: foodIds },
        isAvailable: true,
      });

      if (foods.length !== foodIds.length) {
        return res.status(400).json({
          success: false,
          message:
            "One or more selected foods are unavailable or do not exist",
        });
      }

      const foodMap = new Map(
        foods.map((food) => [
          food._id.toString(),
          food,
        ])
      );

      const updatedItems = [];

      for (const item of items) {
        const food = foodMap.get(
          item.food.toString()
        );

        if (!food) {
          return res.status(400).json({
            success: false,
            message: "Food not found",
          });
        }

        const quantity = Number(item.quantity);

        if (
          !Number.isInteger(quantity) ||
          quantity < 1
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Item quantity must be a positive integer",
          });
        }

        updatedItems.push({
          food: food._id,
          name: food.name,
          price: food.price,
          quantity,
          subtotal:
            food.price * quantity,
        });
      }

      order.items = updatedItems;

      order.subtotal = updatedItems.reduce(
        (total, item) =>
          total + item.subtotal,
        0
      );

      order.totalAmount =
        order.subtotal +
        order.deliveryFee;
    }

    await order.save();

    await order.populate(
      "user",
      "name email phone"
    );

    await order.populate(
      "items.food",
      "name image"
    );

    return res.status(200).json({
      success: true,
      message: "Order updated successfully",
      data: {
        order,
      },
    });
  } catch (error) {
    console.error(
      "Customer update order error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


/*
|--------------------------------------------------------------------------
| CANCEL ORDER
|--------------------------------------------------------------------------
| DELETE /api/orders/:id
*/
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findOne({
      _id: id,
      user: req.user.id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (
      ["DELIVERED", "CANCELLED"].includes(
        order.orderStatus
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Order cannot be cancelled because it is ${order.orderStatus.toLowerCase()}`,
      });
    }

    order.orderStatus = "CANCELLED";

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: {
        order,
      },
    });
  } catch (error) {
    console.error(
      "Cancel order error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


/*
|--------------------------------------------------------------------------
| ADMIN GET ALL ORDERS
|--------------------------------------------------------------------------
| GET /api/orders/admin/all
*/
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate(
        "user",
        "name email phone"
      )
      .populate(
        "items.food",
        "name image"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        orders,
      },
    });
  } catch (error) {
    console.error(
      "Get all orders error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


/*
|--------------------------------------------------------------------------
| ADMIN GET SINGLE ORDER
|--------------------------------------------------------------------------
| GET /api/orders/admin/:id
*/
const getAdminOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findById(id)
      .populate(
        "user",
        "name email phone"
      )
      .populate(
        "items.food",
        "name image"
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        order,
      },
    });
  } catch (error) {
    console.error(
      "Get admin order error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


/*
|--------------------------------------------------------------------------
| ADMIN UPDATE ORDER STATUS
|--------------------------------------------------------------------------
| PATCH /api/orders/admin/:id/status
*/
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const allowedStatuses = [
      "PENDING",
      "CONFIRMED",
      "PREPARING",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CANCELLED",
    ];

    if (!allowedStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.orderStatus = orderStatus;

    await order.save();

    await order.populate(
      "user",
      "name email phone"
    );

    await order.populate(
      "items.food",
      "name image"
    );

    return res.status(200).json({
      success: true,
      message:
        "Order status updated successfully",
      data: {
        order,
      },
    });
  } catch (error) {
    console.error(
      "Update order status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


/*
|--------------------------------------------------------------------------
| ADMIN UPDATE PAYMENT STATUS
|--------------------------------------------------------------------------
| PATCH /api/orders/admin/:id/payment-status
*/
const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const allowedStatuses = [
      "PENDING",
      "PAID",
      "FAILED",
      "REFUNDED",
    ];

    if (!allowedStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.paymentStatus = paymentStatus;

    await order.save();

    await order.populate(
      "user",
      "name email phone"
    );

    await order.populate(
      "items.food",
      "name image"
    );

    return res.status(200).json({
      success: true,
      message:
        "Payment status updated successfully",
      data: {
        order,
      },
    });
  } catch (error) {
    console.error(
      "Update payment status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


/*
|--------------------------------------------------------------------------
| ADMIN FULL ORDER UPDATE
|--------------------------------------------------------------------------
| PATCH /api/orders/admin/:id
|
| Admin can modify:
| - deliveryAddress
| - paymentMethod
| - paymentStatus
| - orderStatus
| - items
|--------------------------------------------------------------------------
*/
const updateAdminOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      deliveryAddress,
      paymentMethod,
      paymentStatus,
      orderStatus,
      items,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    /*
     * Payment methods MUST match Order.js
     */
    const allowedPaymentMethods = [
      "COD",
      "ESEWA",
      "KHALTI",
    ];

    const allowedPaymentStatuses = [
      "PENDING",
      "PAID",
      "FAILED",
      "REFUNDED",
    ];

    const allowedOrderStatuses = [
      "PENDING",
      "CONFIRMED",
      "PREPARING",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CANCELLED",
    ];

    /*
     * Validate payment method
     */
    if (
      paymentMethod !== undefined &&
      !allowedPaymentMethods.includes(
        paymentMethod
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    /*
     * Validate payment status
     */
    if (
      paymentStatus !== undefined &&
      !allowedPaymentStatuses.includes(
        paymentStatus
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status",
      });
    }

    /*
     * Validate order status
     */
    if (
      orderStatus !== undefined &&
      !allowedOrderStatuses.includes(
        orderStatus
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    /*
     * Update address
     */
    if (deliveryAddress !== undefined) {
      if (
        typeof deliveryAddress !== "string" ||
        deliveryAddress.trim().length < 5
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Delivery address must be at least 5 characters",
        });
      }

      if (
        deliveryAddress.trim().length > 300
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Delivery address cannot exceed 300 characters",
        });
      }

      order.deliveryAddress =
        deliveryAddress.trim();
    }

    /*
     * Update payment method
     */
    if (paymentMethod !== undefined) {
      order.paymentMethod =
        paymentMethod;
    }

    /*
     * Update payment status
     */
    if (paymentStatus !== undefined) {
      order.paymentStatus =
        paymentStatus;
    }

    /*
     * Update order status
     */
    if (orderStatus !== undefined) {
      order.orderStatus =
        orderStatus;
    }

    /*
     * Update ordered items
     *
     * Example:
     *
     * items: [
     *   {
     *     food: "foodId",
     *     quantity: 2
     *   },
     *   {
     *     food: "anotherFoodId",
     *     quantity: 1
     *   }
     * ]
     *
     * Admin can therefore:
     * - increase quantity
     * - decrease quantity
     * - add new food
     * - remove food
     */
    if (items !== undefined) {
      if (!Array.isArray(items)) {
        return res.status(400).json({
          success: false,
          message: "Items must be an array",
        });
      }

      if (items.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "Order must contain at least one item",
        });
      }

      /*
       * Validate food IDs
       */
      for (const item of items) {
        if (
          !item ||
          !mongoose.Types.ObjectId.isValid(
            item.food
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Every item must contain a valid food ID",
          });
        }

        const quantity = Number(
          item.quantity
        );

        if (
          !Number.isInteger(quantity) ||
          quantity < 1
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Item quantity must be a positive integer",
          });
        }
      }

      /*
       * Fetch current food information.
       *
       * This means the admin does NOT send
       * name or price manually.
       */
      const foodIds = items.map(
        (item) => item.food
      );

      const foods = await Food.find({
        _id: { $in: foodIds },
        isAvailable: true,
      });

      if (foods.length !== foodIds.length) {
        return res.status(400).json({
          success: false,
          message:
            "One or more selected foods are unavailable or do not exist",
        });
      }

      const foodMap = new Map(
        foods.map((food) => [
          food._id.toString(),
          food,
        ])
      );

      const updatedItems = items.map(
        (item) => {
          const food = foodMap.get(
            item.food.toString()
          );

          return {
            food: food._id,
            name: food.name,
            price: food.price,
            quantity: Number(
              item.quantity
            ),
            subtotal:
              food.price *
              Number(item.quantity),
          };
        }
      );

      order.items = updatedItems;

      /*
       * Recalculate totals
       */
      order.subtotal =
        updatedItems.reduce(
          (total, item) =>
            total + item.subtotal,
          0
        );

      order.totalAmount =
        order.subtotal +
        order.deliveryFee;
    }

    await order.save();

    await order.populate(
      "user",
      "name email phone"
    );

    await order.populate(
      "items.food",
      "name image"
    );

    return res.status(200).json({
      success: true,
      message:
        "Order updated successfully",
      data: {
        order,
      },
    });
  } catch (error) {
    console.error(
      "Update admin order error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/
module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  getAdminOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  updateCustomerOrder,
  updateAdminOrder,
};
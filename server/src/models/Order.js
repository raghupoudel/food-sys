const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    food: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Food",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: "Order must contain at least one item",
      },
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    deliveryFee: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    deliveryAddress: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 300,
    },

    paymentMethod: {
      type: String,
      enum: ["COD", "ESEWA", "KHALTI"],
      default: "COD",
    },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      default: "PENDING",
    },

    esewaTransactionUuid: {
     type: String,
     default: null,
    },

    paymentDetails: {
  transactionUuid: {
    type: String,
    default: null,
  },

  transactionCode: {
    type: String,
    default: null,
  },

  refId: {
    type: String,
    default: null,
  },
},

    orderStatus: {
      type: String,
      enum: [
        "PENDING",
        "CONFIRMED",
        "PREPARING",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
      ],
      default: "PENDING",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);

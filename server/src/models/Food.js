const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Food name is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    description: {
      type: String,
      required: [true, "Food description is required"],
      trim: true,
      maxlength: 500,
    },

    price: {
      type: Number,
      required: [true, "Food price is required"],
      min: 0,
    },

    image: {
      type: String,
      default: "",
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },

    preparationTime: {
      type: Number,
      required: [true, "Preparation time is required"],
      min: 1,
      max: 180,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },

    isVegetarian: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Food", foodSchema);

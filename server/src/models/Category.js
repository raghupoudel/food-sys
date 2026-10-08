const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    description: {
      type: String,
      default: "",
      maxlength: 200,
    },

    image: {
      type: String,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },

  {
    timestamps: true,
  }
);

module.exports =
  mongoose.model(
    "Category",
    categorySchema
  );
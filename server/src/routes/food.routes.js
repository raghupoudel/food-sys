const express = require("express");

const {
  createFood,
  getFoods,
  getFoodById,
  updateFood,
  deleteFood,
  updateFoodAvailability,
} = require("../controllers/food.controller");

const protect = require("../middleware/auth.middleware");
const adminOnly = require("../middleware/admin.middleware");
const upload = require("../config/multer");

const router = express.Router();

// Public
router.get("/", getFoods);
router.get("/:id", getFoodById);

// Admin
router.post(
  "/",
  protect,
  adminOnly,
  upload.single("image"),
  createFood
);

router.put(
  "/:id",
  protect,
  adminOnly,
  upload.single("image"),
  updateFood
);

router.delete("/:id", protect, adminOnly, deleteFood);

router.patch(
  "/:id/availability",
  protect,
  adminOnly,
  updateFoodAvailability
);

module.exports = router;

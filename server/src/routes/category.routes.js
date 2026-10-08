const express = require("express");

const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require("../controllers/category.controller");

const protect = require("../middleware/auth.middleware");
const adminOnly = require("../middleware/admin.middleware");
const upload = require("../config/multer");

const router = express.Router();

// PUBLIC ROUTES
router.get("/", getCategories);
router.get("/:id", getCategoryById);

// ADMIN ROUTES

router.post(
  "/",
  protect,
  adminOnly,
  upload.single("image"),
  createCategory
);

router.put(
  "/:id",
  protect,
  adminOnly,
  upload.single("image"),
  updateCategory
);

router.delete(
  "/:id",
  protect,
  adminOnly,
  deleteCategory
);

module.exports = router;
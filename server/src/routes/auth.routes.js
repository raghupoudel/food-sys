const express = require("express");

const {
  register,
  login,
  getMe,
} = require("../controllers/auth.controller");

const protect = require("../middleware/auth.middleware");
const adminOnly = require("../middleware/admin.middleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);

router.get("/admin-test", protect, adminOnly, (req, res) => {
  res.json({
    success: true,
    message: "Admin authorization is working",
    admin: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

module.exports = router;

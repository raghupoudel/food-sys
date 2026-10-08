const express = require("express");

const {
  initiateEsewaPayment,
} = require("../controllers/esewa.controller");

const protect = require("../middleware/auth.middleware");

const router = express.Router();

router.post(
  "/initiate",
  protect,
  initiateEsewaPayment
);

module.exports = router;

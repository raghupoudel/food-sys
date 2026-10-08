const express = require("express");
const cors = require("cors");
const orderRoutes = require("./routes/order.routes");
const foodRoutes = require("./routes/food.routes");
const uploadRoutes = require("./routes/upload.routes");
const authRoutes = require("./routes/auth.routes");
const categoryRoutes = require("./routes/category.routes");
const cartRoutes = require("./routes/cart.routes");
const esewaRoutes = require("./routes/esewa.routes");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Online Food Ordering API is running",
  });
});

app.use("/api/foods", foodRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/esewa", esewaRoutes);

module.exports = app;

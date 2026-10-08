require("dotenv").config();

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const User = require("./src/models/User");

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const existingAdmin = await User.findOne({
      email: "admin@foodordering.com",
    });

    if (existingAdmin) {
      console.log("Admin already exists.");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash("Admin@12345", 12);

    const admin = await User.create({
      name: "Restaurant Admin",
      email: "admin@foodordering.com",
      password: hashedPassword,
      role: "ADMIN",
      provider: "LOCAL",
      isVerified: true,
      isActive: true,
    });

    console.log("Admin created successfully.");
    console.log(`Email: ${admin.email}`);
    console.log("Password: Admin@12345");

    process.exit(0);
  } catch (error) {
    console.error("Failed to create admin:", error.message);
    process.exit(1);
  }
};

createAdmin();

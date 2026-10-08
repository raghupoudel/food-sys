const express = require("express");
const upload = require("../config/multer");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

const router = express.Router();

router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image is required",
      });
    }

    const result = await uploadToCloudinary(
      req.file.buffer,
      "online-food-ordering/foods"
    );

    return res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      data: {
        url: result.secure_url,
        publicId: result.public_id,
      },
    });
  } catch (error) {
    console.error("Image upload error:", error);

    return res.status(500).json({
      success: false,
      message: "Image upload failed",
    });
  }
});

module.exports = router;

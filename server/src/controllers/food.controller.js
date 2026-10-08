const { z } = require("zod");
const mongoose = require("mongoose");

const Food = require("../models/Food");
const Category = require("../models/Category");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

// ===============================
// Validation Schema
// ===============================
const foodSchema = z.object({
  name: z.string().trim().min(2).max(100),

  description: z.string().trim().min(2).max(500),

  price: z.coerce.number().min(0),

  image: z.string().url().optional().or(z.literal("")),

  category: z.string().refine(
    (value) => mongoose.Types.ObjectId.isValid(value),
    {
      message: "Invalid category ID",
    }
  ),

  preparationTime: z.coerce
    .number()
    .int()
    .min(1)
    .max(180),

  isAvailable: z
    .union([
      z.boolean(),
      z.string().transform(
        (value) => value === "true"
      ),
    ])
    .optional(),

  isVegetarian: z
    .union([
      z.boolean(),
      z.string().transform(
        (value) => value === "true"
      ),
    ])
    .optional(),
});

// ===============================
// CREATE FOOD
// ===============================
const createFood = async (req, res) => {
  try {
    console.log("CREATE FOOD REQUEST BODY:", req.body);

    console.log(
      "CREATE FOOD FILE:",
      req.file
        ? {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
          }
        : "NO FILE"
    );

    const body = {
      ...req.body,
    };

    // ===============================
    // CONVERT BOOLEAN VALUES
    // ===============================

    if (body.isAvailable !== undefined) {
      body.isAvailable =
        body.isAvailable === true ||
        body.isAvailable === "true";
    }

    if (body.isVegetarian !== undefined) {
      body.isVegetarian =
        body.isVegetarian === true ||
        body.isVegetarian === "true";
    }

    // ===============================
    // IMAGE UPLOAD
    // ===============================

    if (req.file) {
      console.log("IMAGE FILE RECEIVED:");

      console.log({
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        hasBuffer: Buffer.isBuffer(
          req.file.buffer
        ),
      });

      const result =
        await uploadToCloudinary(
          req.file.buffer,
          "online-food-ordering/foods"
        );

      console.log(
        "CLOUDINARY RESULT:",
        result
      );

      if (
        !result ||
        !result.secure_url
      ) {
        return res.status(500).json({
          success: false,
          message: "Image upload failed",
        });
      }

      body.image =
        result.secure_url;

      console.log(
        "IMAGE URL SET TO:",
        body.image
      );
    } else {
      // IMPORTANT:
      // Do not send image: {}
      // when no image was selected.

      delete body.image;
    }

    // ===============================
    // REMOVE INVALID EMPTY IMAGE
    // ===============================

    if (
      body.image === "" ||
      body.image === "null" ||
      body.image === "undefined"
    ) {
      delete body.image;
    }

    console.log(
      "FINAL CREATE BODY BEFORE VALIDATION:",
      body
    );

    // ===============================
    // VALIDATE
    // ===============================

    const validation =
      foodSchema.safeParse(body);

    if (!validation.success) {
      console.error(
        "CREATE FOOD VALIDATION ERROR:",
        validation.error.flatten()
      );

      return res.status(400).json({
        success: false,
        message: "Invalid food data",
        errors:
          validation.error.flatten(),
      });
    }

    const data =
      validation.data;

    // ===============================
    // CHECK CATEGORY
    // ===============================

    const category =
      await Category.findOne({
        _id: data.category,
        isActive: true,
      });

    if (!category) {
      return res.status(404).json({
        success: false,
        message:
          "Category not found or inactive",
      });
    }

    // ===============================
    // CREATE FOOD
    // ===============================

    const food =
      await Food.create(data);

    const populatedFood =
      await Food.findById(
        food._id
      ).populate(
        "category",
        "name"
      );

    return res.status(201).json({
      success: true,
      message:
        "Food created successfully",
      data: {
        food: populatedFood,
      },
    });
  } catch (error) {
    console.error(
      "Create food error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Internal server error",
      error: error.message,
    });
  }
};

// ===============================
// GET ALL FOODS
// ===============================
const getFoods = async (req, res) => {
  try {
    const foods = await Food.find()
      .populate("category", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        foods,
      },
    });
  } catch (error) {
    console.error(
      "Get foods error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ===============================
// GET FOOD BY ID
// ===============================
const getFoodById = async (req, res) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid food ID",
      });
    }

    const food =
      await Food.findById(
        req.params.id
      ).populate("category", "name");

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Food not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        food,
      },
    });
  } catch (error) {
    console.error(
      "Get food by ID error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ===============================
// UPDATE FOOD
// ===============================
const updateFood = async (req, res) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid food ID",
      });
    }

    const body = {
      ...req.body,
    };

    console.log(
      "UPDATE FOOD REQUEST BODY:",
      req.body
    );

    console.log(
      "UPDATE FOOD FILE:",
      req.file
        ? {
            originalname:
              req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
          }
        : "NO FILE"
    );

    // Convert boolean values
    if (body.isAvailable !== undefined) {
      body.isAvailable =
        body.isAvailable === true ||
        body.isAvailable === "true";
    }

    if (body.isVegetarian !== undefined) {
      body.isVegetarian =
        body.isVegetarian === true ||
        body.isVegetarian === "true";
    }

    // ===============================
    // IMAGE UPLOAD
    // ===============================
    if (req.file) {
      console.log(
        "IMAGE FILE RECEIVED:"
      );

      console.log({
        originalname:
          req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        hasBuffer: Buffer.isBuffer(
          req.file.buffer
        ),
      });

      const result =
        await uploadToCloudinary(
          req.file.buffer,
          "online-food-ordering/foods"
        );

      console.log(
        "CLOUDINARY RESULT:",
        result
      );

      if (
        !result ||
        !result.secure_url
      ) {
        return res.status(500).json({
          success: false,
          message:
            "Image upload failed",
        });
      }

      body.image =
        result.secure_url;

      console.log(
        "IMAGE URL SET TO:",
        body.image
      );
    }

    // ===============================
    // IMPORTANT:
    // If no new image was uploaded,
    // do not validate image from
    // multipart request.
    // ===============================
    if (!req.file) {
      delete body.image;
    }

    // Remove invalid empty values
    if (
      body.image === "" ||
      body.image === "null" ||
      body.image === "undefined"
    ) {
      delete body.image;
    }

    console.log(
      "FINAL BODY BEFORE VALIDATION:",
      body
    );

    // ===============================
    // VALIDATION
    // ===============================
    const validation =
      foodSchema
        .partial()
        .safeParse(body);

    if (!validation.success) {
      console.error(
        "UPDATE FOOD VALIDATION ERROR:",
        validation.error.flatten()
      );

      console.error(
        "UPDATE FOOD BODY:",
        body
      );

      return res.status(400).json({
        success: false,
        message: "Invalid food data",
        errors:
          validation.error.flatten(),
      });
    }

    const data =
      validation.data;

    // ===============================
    // CHECK CATEGORY
    // ===============================
    if (data.category) {
      const category =
        await Category.findOne({
          _id: data.category,
          isActive: true,
        });

      if (!category) {
        return res.status(404).json({
          success: false,
          message:
            "Category not found or inactive",
        });
      }
    }

    // ===============================
    // UPDATE DATABASE
    // ===============================
    const food =
      await Food.findByIdAndUpdate(
        req.params.id,
        data,
        {
          new: true,
          runValidators: true,
        }
      ).populate(
        "category",
        "name"
      );

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Food not found",
      });
    }

    console.log(
      "FOOD UPDATED SUCCESSFULLY:",
      food._id
    );

    return res.status(200).json({
      success: true,
      message:
        "Food updated successfully",
      data: {
        food,
      },
    });
  } catch (error) {
    console.error(
      "Update food error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ===============================
// DELETE FOOD
// ===============================
const deleteFood = async (req, res) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid food ID",
      });
    }

    const food =
      await Food.findByIdAndDelete(
        req.params.id
      );

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Food not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Food deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete food error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ===============================
// UPDATE FOOD AVAILABILITY
// ===============================
const updateFoodAvailability =
  async (req, res) => {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid food ID",
        });
      }

      const isAvailable =
        req.body.isAvailable;

      if (
        typeof isAvailable !==
        "boolean"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "isAvailable must be boolean",
        });
      }

      const food =
        await Food.findByIdAndUpdate(
          req.params.id,
          {
            isAvailable,
          },
          {
            new: true,
            runValidators: true,
          }
        ).populate(
          "category",
          "name"
        );

      if (!food) {
        return res.status(404).json({
          success: false,
          message: "Food not found",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Food availability updated",
        data: {
          food,
        },
      });
    } catch (error) {
      console.error(
        "Update food availability error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Internal server error",
      });
    }
  };

// ===============================
// EXPORTS
// ===============================
module.exports = {
  createFood,
  getFoods,
  getFoodById,
  updateFood,
  deleteFood,
  updateFoodAvailability,
};
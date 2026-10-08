const { z } = require("zod");
const Category = require("../models/Category");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

const categorySchema = z.object({
  name: z.string().min(2).max(50),

  description: z.string().max(200).optional(),

  image: z.string().optional(),
});

const createCategory = async (req, res) => {
  try {
    const body = {
      ...req.body,
    };

    // Upload image to Cloudinary
    if (req.file) {
      const result = await uploadToCloudinary(
        req.file.buffer,
        "online-food-ordering/categories"
      );

      body.image = result.secure_url;
    }

    const validation = categorySchema.safeParse(body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid category data",
        errors: validation.error.flatten(),
      });
    }

    const {
      name,
      description,
      image,
    } = validation.data;

    const existingCategory =
      await Category.findOne({
        name: {
          $regex: `^${name}$`,
          $options: "i",
        },
      });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: "Category already exists",
      });
    }

    const category = await Category.create({
      name,
      description: description || "",
      image: image || "",
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: {
        category,
      },
    });
  } catch (error) {
    console.error(
      "Create category error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


const getCategories = async (req, res) => {
  try {
    const categories =
      await Category.find({
        isActive: true,
      }).sort({
        name: 1,
      });

    return res.status(200).json({
      success: true,
      data: {
        categories,
      },
    });
  } catch (error) {
    console.error(
      "Get categories error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


const getCategoryById = async (req, res) => {
  try {
    const category =
      await Category.findOne({
        _id: req.params.id,
        isActive: true,
      });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        category,
      },
    });
  } catch (error) {
    console.error(
      "Get category error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


const updateCategory = async (req, res) => {
  try {
    const body = {
      ...req.body,
    };

    // Upload new image if selected
    if (req.file) {
      const result = await uploadToCloudinary(
        req.file.buffer,
        "online-food-ordering/categories"
      );

      body.image = result.secure_url;
    }

    const validation =
      categorySchema.partial().safeParse(body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid category data",
        errors: validation.error.flatten(),
      });
    }

    const category =
      await Category.findByIdAndUpdate(
        req.params.id,
        validation.data,
        {
          new: true,
          runValidators: true,
        }
      );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: {
        category,
      },
    });
  } catch (error) {
    console.error(
      "Update category error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


const deleteCategory = async (req, res) => {
  try {
    const category =
      await Category.findByIdAndUpdate(
        req.params.id,
        {
          isActive: false,
        },
        {
          new: true,
        }
      );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete category error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
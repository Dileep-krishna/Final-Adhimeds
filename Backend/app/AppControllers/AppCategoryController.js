// Backend/app/AppControllers/AppCategoryController.js

import mongoose from "mongoose";
import Category from "../../model/categorymanagmentModel.js";


// ======================================================
// GET ALL MAIN CATEGORIES
// ======================================================

export const getCategories = async (req, res) => {
  try {
    const {
      search,
      page = 1,
      limit = 50,
    } = req.query;

    const currentPage = Math.max(parseInt(page) || 1, 1);
    const perPage = Math.min(parseInt(limit) || 50, 100);
    const skip = (currentPage - 1) * perPage;

    // Main categories only
    const filter = {
      parent: null,
      status: "active",
    };

    // Optional search
    if (search && typeof search === "string") {
      const escapedSearch = search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      filter.name = {
        $regex: escapedSearch,
        $options: "i",
      };
    }

    const [categories, total] = await Promise.all([
      Category.find(filter)
        .select(
          "_id name icon coverImage banner order isFeatured isHot status"
        )
        .sort({ order: 1, name: 1 })
        .skip(skip)
        .limit(perPage)
        .lean(),

      Category.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      data: categories,
      pagination: {
        total,
        page: currentPage,
        limit: perPage,
        totalPages: Math.ceil(total / perPage),
      },
    });

  } catch (error) {
    console.error("Get categories error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching categories",
      error: error.message,
    });
  }
};


// ======================================================
// GET SUBCATEGORIES BY CATEGORY
// ======================================================

export const getSubcategories = async (req, res) => {
  try {
    const { categoryId } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    // Check parent category
    const parentCategory = await Category.findOne({
      _id: categoryId,
      status: "active",
    })
      .select("_id name icon coverImage banner")
      .lean();

    if (!parentCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Get subcategories
    const subcategories = await Category.find({
      parent: categoryId,
      status: "active",
    })
      .select(
        "_id name icon coverImage banner order isFeatured isHot status"
      )
      .sort({ order: 1, name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Subcategories fetched successfully",

      category: parentCategory,

      data: subcategories,

      total: subcategories.length,
    });

  } catch (error) {
    console.error("Get subcategories error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching subcategories",
      error: error.message,
    });
  }
};
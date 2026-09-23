import mongoose from "mongoose";
import Product from "../../model/AddProductPageModel.js";
import Category from "../../model/categorymanagmentModel.js";

const getImageUrl = (filename) => {
  if (!filename) return "";

  if (filename.startsWith("http://") || filename.startsWith("https://")) {
    return filename;
  }

  const baseUrl = process.env.APP_URL || "http://localhost:5001";

  return `${baseUrl}/imgUploads/${filename}`;
};

const formatProduct = (product) => {
  let sellingPrice = product.unitPrice || 0;

  if (product.discountType === "percent") {
    sellingPrice =
      product.unitPrice -
      (product.unitPrice * (product.discount || 0)) / 100;
  } else if (product.discountType === "fixed") {
    sellingPrice = product.unitPrice - (product.discount || 0);
  }

  sellingPrice = Math.max(0, Number(sellingPrice.toFixed(2)));

  return {
    ...product,

    thumbnail: getImageUrl(product.thumbnail),

    galleryImages: (product.galleryImages || []).map((image) =>
      getImageUrl(image)
    ),

    metaImage: getImageUrl(product.metaImage),

    sellingPrice,

    discountAmount:
      product.discountType === "percent"
        ? Number(
            ((product.unitPrice * (product.discount || 0)) / 100).toFixed(2)
          )
        : Number((product.discount || 0).toFixed(2)),
  };
};


// ======================================================
// GET ALL PRODUCTS
// GET /api/app/products
// ======================================================

export const getAllAppProducts = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 20,
      search,
      brand,
      minPrice,
      maxPrice,
      featured,
      todaysDeal,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    page = Math.max(parseInt(page) || 1, 1);
    limit = Math.min(Math.max(parseInt(limit) || 20, 1), 50);

    const skip = (page - 1) * limit;

    // Only published products for customer app
    const filter = {
      published: true,
    };

    // Search
    if (search && search.trim()) {
      const escapedSearch = search
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        {
          productName: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
        {
          brand: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
        {
          sku: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
      ];
    }

    // Brand
    if (brand && brand.trim()) {
      filter.brand = {
        $regex: `^${brand.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      };
    }

    // Price range
    if (minPrice || maxPrice) {
      filter.unitPrice = {};

      if (minPrice) {
        filter.unitPrice.$gte = Number(minPrice);
      }

      if (maxPrice) {
        filter.unitPrice.$lte = Number(maxPrice);
      }
    }

    // Featured
    if (featured !== undefined) {
      filter.featured = featured === "true";
    }

    // Today's Deal
    if (todaysDeal !== undefined) {
      filter.todaysDeal = todaysDeal === "true";
    }

    // Sorting
    const allowedSortFields = [
      "createdAt",
      "productName",
      "unitPrice",
      "discount",
      "stock",
    ];

    if (!allowedSortFields.includes(sortBy)) {
      sortBy = "createdAt";
    }

    const sort = {
      [sortBy]: sortOrder === "asc" ? 1 : -1,
    };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .select(
          "-externalLink -metaTitle -metaDescription -hsnCode -gstRate"
        )
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),

      Product.countDocuments(filter),
    ]);

    const formattedProducts = products.map(formatProduct);

    return res.status(200).json({
      success: true,
      message: "Products fetched successfully",

      data: formattedProducts,

      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get app products error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching products",
      error: error.message,
    });
  }
};


// ======================================================
// GET PRODUCTS BY CATEGORY
// GET /api/app/products/category/:categoryId
// ======================================================

export const getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const category = await Category.findOne({
      _id: categoryId,
      status: "active",
    })
      .select("_id name parent")
      .lean();

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    let {
      page = 1,
      limit = 20,
      search,
      brand,
      minPrice,
      maxPrice,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    page = Math.max(parseInt(page) || 1, 1);
    limit = Math.min(Math.max(parseInt(limit) || 20, 1), 50);

    const skip = (page - 1) * limit;

    /*
     * mainCategory and relatedCategories are strings
     * in the existing Product model.
     */

    const filter = {
      published: true,

      $or: [
        {
          mainCategory: {
            $regex: `^${category.name.replace(
              /[.*+?^${}()|[\]\\]/g,
              "\\$&"
            )}$`,
            $options: "i",
          },
        },
        {
          relatedCategories: {
            $regex: `^${category.name.replace(
              /[.*+?^${}()|[\]\\]/g,
              "\\$&"
            )}$`,
            $options: "i",
          },
        },
      ],
    };

    if (search && search.trim()) {
      const escapedSearch = search
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$and = [
        {
          $or: [
            {
              productName: {
                $regex: escapedSearch,
                $options: "i",
              },
            },
            {
              brand: {
                $regex: escapedSearch,
                $options: "i",
              },
            },
            {
              sku: {
                $regex: escapedSearch,
                $options: "i",
              },
            },
          ],
        },
      ];
    }

    if (brand && brand.trim()) {
      filter.brand = {
        $regex: `^${brand.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      };
    }

    if (minPrice || maxPrice) {
      filter.unitPrice = {};

      if (minPrice) {
        filter.unitPrice.$gte = Number(minPrice);
      }

      if (maxPrice) {
        filter.unitPrice.$lte = Number(maxPrice);
      }
    }

    const allowedSortFields = [
      "createdAt",
      "productName",
      "unitPrice",
      "discount",
      "stock",
    ];

    if (!allowedSortFields.includes(sortBy)) {
      sortBy = "createdAt";
    }

    const sort = {
      [sortBy]: sortOrder === "asc" ? 1 : -1,
    };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .select(
          "-externalLink -metaTitle -metaDescription -hsnCode -gstRate"
        )
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),

      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Category products fetched successfully",

      category,

      data: products.map(formatProduct),

      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get products by category error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching category products",
      error: error.message,
    });
  }
};


// ======================================================
// GET PRODUCTS BY SUBCATEGORY
// GET /api/app/products/subcategory/:subcategoryId
// ======================================================

export const getProductsBySubcategory = async (req, res) => {
  try {
    const { subcategoryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(subcategoryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subcategory ID",
      });
    }

    const subcategory = await Category.findOne({
      _id: subcategoryId,
      status: "active",
    })
      .populate("parent", "_id name")
      .select("_id name parent")
      .lean();

    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: "Subcategory not found",
      });
    }

    const categoryName = subcategory.name;

    let {
      page = 1,
      limit = 20,
      search,
      brand,
      minPrice,
      maxPrice,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    page = Math.max(parseInt(page) || 1, 1);
    limit = Math.min(Math.max(parseInt(limit) || 20, 1), 50);

    const skip = (page - 1) * limit;

    const escapedCategoryName = categoryName.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    const filter = {
      published: true,

      $or: [
        {
          mainCategory: {
            $regex: `^${escapedCategoryName}$`,
            $options: "i",
          },
        },
        {
          relatedCategories: {
            $regex: `^${escapedCategoryName}$`,
            $options: "i",
          },
        },
      ],
    };

    if (search && search.trim()) {
      const escapedSearch = search
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$and = [
        {
          $or: [
            {
              productName: {
                $regex: escapedSearch,
                $options: "i",
              },
            },
            {
              brand: {
                $regex: escapedSearch,
                $options: "i",
              },
            },
            {
              sku: {
                $regex: escapedSearch,
                $options: "i",
              },
            },
          ],
        },
      ];
    }

    if (brand && brand.trim()) {
      filter.brand = {
        $regex: `^${brand.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      };
    }

    if (minPrice || maxPrice) {
      filter.unitPrice = {};

      if (minPrice) {
        filter.unitPrice.$gte = Number(minPrice);
      }

      if (maxPrice) {
        filter.unitPrice.$lte = Number(maxPrice);
      }
    }

    const allowedSortFields = [
      "createdAt",
      "productName",
      "unitPrice",
      "discount",
      "stock",
    ];

    if (!allowedSortFields.includes(sortBy)) {
      sortBy = "createdAt";
    }

    const sort = {
      [sortBy]: sortOrder === "asc" ? 1 : -1,
    };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .select(
          "-externalLink -metaTitle -metaDescription -hsnCode -gstRate"
        )
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),

      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Subcategory products fetched successfully",

      subcategory,

      data: products.map(formatProduct),

      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get products by subcategory error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching subcategory products",
      error: error.message,
    });
  }
};


// ======================================================
// GET SINGLE PRODUCT
// GET /api/app/products/:id
// ======================================================

export const getAppProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findOne({
      _id: id,
      published: true,
    }).lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product fetched successfully",
      data: formatProduct(product),
    });
  } catch (error) {
    console.error("Get app product error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching product",
      error: error.message,
    });
  }
};
export const searchProducts = async (req, res) => {
  try {
    const { query } = req.params;

    if (!query || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const searchText = query.trim();

    const escapedSearch = searchText.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    const products = await Product.find({
      published: true,
      $or: [
        {
          productName: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
        {
          brand: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
        {
          sku: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
        {
          barcode: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.status(200).json({
      success: true,
      message: "Search results fetched successfully",
      query: searchText,
      total: products.length,
      data: products.map(formatProduct),
    });
  } catch (error) {
    console.error("Search products error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while searching products",
      error: error.message,
    });
  }
};
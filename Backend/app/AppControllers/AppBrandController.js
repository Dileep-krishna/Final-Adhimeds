import Brand from "../../model/Brand.js";
import Product from "../../model/AddProductPageModel.js";

const getImageUrl = (filename) => {
  if (!filename) return "";

  if (filename.startsWith("http://") || filename.startsWith("https://")) {
    return filename;
  }

  return `${process.env.APP_URL || "http://localhost:5001"}/imgUploads/${filename.replace(/^\/+/, "")}`;
};


// GET ALL BRANDS
export const getAllAppBrands = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const search = (req.query.search || "").trim();

    const filter = {};

    if (search) {
      filter.name = {
        $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        $options: "i",
      };
    }

    const skip = (page - 1) * limit;

    const [brands, total] = await Promise.all([
      Brand.find(filter)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Brand.countDocuments(filter),
    ]);

    // Add product count for each brand
    const brandNames = brands.map((brand) => brand.name);

    const productCounts = await Product.aggregate([
      {
        $match: {
          published: true,
          brand: { $in: brandNames },
        },
      },
      {
        $group: {
          _id: "$brand",
          count: { $sum: 1 },
        },
      },
    ]);

    const countMap = {};

    productCounts.forEach((item) => {
      countMap[item._id] = item.count;
    });

    const data = brands.map((brand) => ({
      _id: brand._id,
      name: brand.name,
      logo: getImageUrl(brand.logo),
      category: brand.category || "General",
      productCount: countMap[brand.name] || 0,
    }));

    res.status(200).json({
      success: true,
      message: "Brands fetched successfully",
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching app brands:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch brands",
      error: error.message,
    });
  }
};


// GET SINGLE BRAND
export const getAppBrandById = async (req, res) => {
  try {
    const { id } = req.params;

    const brand = await Brand.findById(id).lean();

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    const productCount = await Product.countDocuments({
      published: true,
      brand: brand.name,
    });

    res.status(200).json({
      success: true,
      message: "Brand fetched successfully",
      data: {
        _id: brand._id,
        name: brand.name,
        logo: getImageUrl(brand.logo),
        category: brand.category || "General",
        productCount,
      },
    });
  } catch (error) {
    console.error("Error fetching app brand:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch brand",
      error: error.message,
    });
  }
};
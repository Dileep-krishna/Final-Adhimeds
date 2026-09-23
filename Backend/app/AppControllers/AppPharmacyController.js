// Backend/app/AppControllers/AppPharmacyController.js

import StaffMember from "../../model/staffmanagementModel.js";
import Role from "../../model/Role.js";


// ======================================================
// GET ALL PHARMACISTS
// ======================================================

export const getAllPharmacists = async (req, res) => {
  try {
    const {
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const currentPage = Math.max(parseInt(page) || 1, 1);
    const perPage = Math.min(parseInt(limit) || 20, 50);
    const skip = (currentPage - 1) * perPage;

    // Find Pharmacist role
    const pharmacistRole = await Role.findOne({
      name: { $regex: /^pharmacist$/i },
    });

    if (!pharmacistRole) {
      return res.status(404).json({
        success: false,
        message: "Pharmacist role not found",
      });
    }

    // Base filter
    const filter = {
      role: pharmacistRole._id,
      status: "active",
    };

    // Optional search
    if (search && typeof search === "string") {
      const escapedSearch = search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      filter.$or = [
        {
          fullName: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
        {
          email: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
        {
          phone: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
      ];
    }

    const [pharmacists, total] = await Promise.all([
      StaffMember.find(filter)
        .select("-password")
        .populate(
          "storeId",
          "storeName latitude longitude searchLocation address pincode contactNumber thumbnailImages vendorCategory shopid district"
        )
        .populate("role", "name")
        .sort({ fullName: 1 })
        .skip(skip)
        .limit(perPage)
        .lean(),

      StaffMember.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "All pharmacists fetched successfully",
      data: pharmacists,
      pagination: {
        total,
        page: currentPage,
        limit: perPage,
        totalPages: Math.ceil(total / perPage),
      },
    });

  } catch (error) {
    console.error("Get all pharmacists error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching pharmacists",
      error: error.message,
    });
  }
};


// ======================================================
// GET PHARMACISTS BY DISTRICT
// ======================================================

export const getPharmacistsByDistrict = async (req, res) => {
  try {
    const { district } = req.params;

    const {
      search,
      page = 1,
      limit = 20,
    } = req.query;

    if (!district || !district.trim()) {
      return res.status(400).json({
        success: false,
        message: "District is required",
      });
    }

    const currentPage = Math.max(parseInt(page) || 1, 1);
    const perPage = Math.min(parseInt(limit) || 20, 50);
    const skip = (currentPage - 1) * perPage;

    // Find Pharmacist role
    const pharmacistRole = await Role.findOne({
      name: { $regex: /^pharmacist$/i },
    });

    if (!pharmacistRole) {
      return res.status(404).json({
        success: false,
        message: "Pharmacist role not found",
      });
    }

    // Filter
    const filter = {
      role: pharmacistRole._id,
      status: "active",
      district: district.trim(),
    };

    // Optional search
    if (search && typeof search === "string") {
      const escapedSearch = search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      filter.$or = [
        {
          fullName: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
        {
          email: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
        {
          phone: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
      ];
    }

    const [pharmacists, total] = await Promise.all([
      StaffMember.find(filter)
        .select("-password")
        .populate(
          "storeId",
          "storeName latitude longitude searchLocation address pincode contactNumber thumbnailImages vendorCategory shopid district"
        )
        .populate("role", "name")
        .sort({ fullName: 1 })
        .skip(skip)
        .limit(perPage)
        .lean(),

      StaffMember.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Pharmacists fetched successfully",
      district: district.trim(),
      data: pharmacists,
      pagination: {
        total,
        page: currentPage,
        limit: perPage,
        totalPages: Math.ceil(total / perPage),
      },
    });

  } catch (error) {
    console.error("Get pharmacists by district error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching pharmacists",
      error: error.message,
    });
  }
};


// ======================================================
// GET SINGLE PHARMACIST
// ======================================================

export const getPharmacistById = async (req, res) => {
  try {
    const { id } = req.params;

    const pharmacist = await StaffMember.findById(id)
      .select("-password")
      .populate(
        "storeId",
        "storeName latitude longitude searchLocation address pincode contactNumber thumbnailImages vendorCategory shopid district"
      )
      .populate("role", "name")
      .lean();

    if (!pharmacist) {
      return res.status(404).json({
        success: false,
        message: "Pharmacist not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Pharmacist fetched successfully",
      data: pharmacist,
    });

  } catch (error) {
    console.error("Get pharmacist error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching pharmacist",
      error: error.message,
    });
  }
};
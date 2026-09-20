import Deliveryboys from "../model/deliveryboysModel.js";
import bcrypt from "bcryptjs";

// ──────────────────────────────────────────────
// ADD DELIVERY BOY
// ──────────────────────────────────────────────
export const addDeliveryBoy = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      aadharNumber,
      licenseNumber,
      bikeNumber,
      district,
      status,
    } = req.body;

    // Check if delivery boy already exists
    const existing = await Deliveryboys.findOne({
      $or: [{ email }, { phone }]
    }).lean().select('_id');

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Delivery boy already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Store ONLY the filename (not the full path)
    const aadharImage = req.files?.aadharImage?.[0]?.filename || "";
    const licenseImage = req.files?.licenseImage?.[0]?.filename || "";

    const newDeliveryBoy = new Deliveryboys({
      name,
      email,
      phone,
      password: hashedPassword,
      aadharNumber,
      licenseNumber,
      bikeNumber,
      district,
      status: status || 'active',
      aadharImage,
      licenseImage,
      isVerified: true,
      isPhoneVerified: true,
      isAvailable: true,
    });

    await newDeliveryBoy.save();

    res.status(201).json({
      success: true,
      message: "Delivery boy added successfully",
      data: newDeliveryBoy
    });
  } catch (error) {
    console.error("Add error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ──────────────────────────────────────────────
// GET ALL DELIVERY BOYS (with pagination, search, filter)
// ──────────────────────────────────────────────
export const getAllDeliveryBoys = async (req, res) => {
  try {
    // ── Query params ──
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status || 'all'; // all, active, inactive, pending

    // ── Build filter ──
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    if (status !== 'all') {
      filter.status = status;
    }

    // ── Count total ──
    const total = await Deliveryboys.countDocuments(filter);

    // ── Fetch data with pagination ──
    const deliveryBoys = await Deliveryboys.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // ── Log (optional) ──
    console.log(`📦 Sending ${deliveryBoys.length} of ${total} delivery boys (page ${page}/${Math.ceil(total/limit)})`);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      data: deliveryBoys,
      total,
      totalPages,
      page,
      limit,
    });
  } catch (error) {
    console.error("Get all error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────
// UPDATE DELIVERY BOY
// ──────────────────────────────────────────────
export const updateDeliveryBoy = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      password,
      aadharNumber,
      licenseNumber,
      bikeNumber,
      district,
      status,
    } = req.body;

    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (aadharNumber !== undefined) updateData.aadharNumber = aadharNumber;
    if (licenseNumber !== undefined) updateData.licenseNumber = licenseNumber;
    if (bikeNumber !== undefined) updateData.bikeNumber = bikeNumber;
    if (district !== undefined) updateData.district = district;
    if (status !== undefined) updateData.status = status;

    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // ✅ Store ONLY the filename (if a new file is uploaded)
    if (req.files?.aadharImage) {
      updateData.aadharImage = req.files.aadharImage[0].filename;
    }
    if (req.files?.licenseImage) {
      updateData.licenseImage = req.files.licenseImage[0].filename;
    }

    const updatedBoy = await Deliveryboys.findByIdAndUpdate(
      id,
      updateData,
      {
        returnDocument: 'after',   // modern option, replaces new: true
        runValidators: true,
      }
    );

    if (!updatedBoy) {
      return res.status(404).json({
        success: false,
        message: "Delivery boy not found"
      });
    }

    res.status(200).json({
      success: true,
      data: updatedBoy
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ──────────────────────────────────────────────
// DELETE DELIVERY BOY
// ──────────────────────────────────────────────
export const deleteDeliveryBoy = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Deliveryboys.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Delivery boy not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "Delivery boy deleted successfully"
    });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
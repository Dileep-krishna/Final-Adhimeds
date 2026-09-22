import fs from "fs";
import path from "path";
import Prescription from "../model/Prescription.js";

export const uploadPrescription = async (req, res) => {
  try {
    const { doctorName, patientName } = req.body;

    if (!doctorName) {
      return res.status(400).json({
        success: false,
        message: "Doctor name is required",
      });
    }

    if (!patientName) {
      return res.status(400).json({
        success: false,
        message: "Patient name is required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Prescription image or PDF is required",
      });
    }

    const fileType = req.file.mimetype === "application/pdf"
      ? "pdf"
      : "image";

    const fileUrl = `${req.protocol}://${req.get("host")}/imgUploads/${req.file.filename}`;

    const prescription = await Prescription.create({
      userId: req.appUser._id,
      doctorName,
      patientName,
      fileUrl,
      fileName: req.file.originalname,
      fileType,
    });

    return res.status(201).json({
      success: true,
      message: "Prescription uploaded successfully",
      data: prescription,
    });
  } catch (error) {
    console.error("Upload Prescription Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to upload prescription",
      error: error.message,
    });
  }
};

export const getPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({
      userId: req.appUser._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Prescriptions fetched successfully",
      data: prescriptions,
    });
  } catch (error) {
    console.error("Get Prescriptions Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch prescriptions",
      error: error.message,
    });
  }
};

export const getPrescriptionById = async (req, res) => {
  try {
    const prescription = await Prescription.findOne({
      _id: req.params.id,
      userId: req.appUser._id,
    });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: prescription,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch prescription",
      error: error.message,
    });
  }
};

export const updatePrescription = async (req, res) => {
  try {
    const { doctorName, patientName } = req.body;

    const prescription = await Prescription.findOne({
      _id: req.params.id,
      userId: req.appUser._id,
    });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    // Update doctor name
    if (doctorName !== undefined) {
      if (!doctorName.trim()) {
        return res.status(400).json({
          success: false,
          message: "Doctor name cannot be empty",
        });
      }

      prescription.doctorName = doctorName.trim();
    }

    // Update patient name
    if (patientName !== undefined) {
      if (!patientName.trim()) {
        return res.status(400).json({
          success: false,
          message: "Patient name cannot be empty",
        });
      }

      prescription.patientName = patientName.trim();
    }

    // Replace prescription file
    if (req.file) {
      const oldFileName = prescription.fileName;

      const fileType =
        req.file.mimetype === "application/pdf"
          ? "pdf"
          : "image";

      const fileUrl = `${process.env.APP_URL}/imgUploads/${req.file.filename}`;

      prescription.fileUrl = fileUrl;
      prescription.fileName = req.file.filename;
      prescription.fileType = fileType;

      // Delete old file
      if (oldFileName) {
        const oldFilePath = path.join(
          process.cwd(),
          "imgUploads",
          oldFileName
        );

        if (
          fs.existsSync(oldFilePath) &&
          oldFileName !== req.file.filename
        ) {
          fs.unlinkSync(oldFilePath);
        }
      }
    }

    await prescription.save();

    return res.status(200).json({
      success: true,
      message: "Prescription updated successfully",
      data: prescription,
    });
  } catch (error) {
    console.error("Update Prescription Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update prescription",
      error: error.message,
    });
  }
};
export const deletePrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findOneAndDelete({
      _id: req.params.id,
      userId: req.appUser._id,
    });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Prescription deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete prescription",
      error: error.message,
    });
  }
};
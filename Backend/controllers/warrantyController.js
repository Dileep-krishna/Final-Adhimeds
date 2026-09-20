// controllers/warrantyController.js
import Warranty from '../model/Warranty.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper: delete old logo file if it exists
const deleteOldLogo = (logoPath) => {
  if (logoPath && logoPath !== '') {
    const fullPath = path.join(__dirname, '..', logoPath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }
};

// @desc    Get all warranties
// @route   GET /api/warranties
// @access  Public
export const getAllWarranties = async (req, res) => {
  try {
    const warranties = await Warranty.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: warranties });
  } catch (error) {
    console.error('Get all warranties error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single warranty by ID
// @route   GET /api/warranties/:id
// @access  Public
export const getWarrantyById = async (req, res) => {
  try {
    const { id } = req.params;
    const warranty = await Warranty.findById(id);

    if (!warranty) {
      return res.status(404).json({ success: false, message: 'Warranty not found' });
    }

    res.status(200).json({ success: true, data: warranty });
  } catch (error) {
    console.error('Get warranty by ID error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ success: false, message: 'Invalid warranty ID' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create a new warranty (with optional logo upload)
// @route   POST /api/warranties
// @access  Private (Admin)
export const createWarranty = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === '') {
      return res.status(400).json({ success: false, message: 'Warranty text is required' });
    }

    // Optional: check uniqueness
    const existing = await Warranty.findOne({ text: text.trim() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Warranty with this text already exists' });
    }

    let logoPath = null;
    if (req.file) {
      // req.file.path example: "uploads/warranties/filename.jpg"
      logoPath = req.file.path.replace(/\\/g, '/'); // normalize Windows paths
    }

    const warranty = await Warranty.create({
      text: text.trim(),
      logo: logoPath,
    });

    res.status(201).json({ success: true, data: warranty });
  } catch (error) {
    console.error('Create warranty error:', error);
    // If file was uploaded but creation fails, delete the file
    if (req.file) {
      const filePath = path.join(__dirname, '..', req.file.path);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update a warranty (text and/or logo)
// @route   PUT /api/warranties/:id
// @access  Private (Admin)
export const updateWarranty = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    const warranty = await Warranty.findById(id);
    if (!warranty) {
      // If file was uploaded but no warranty found, delete the orphan file
      if (req.file) {
        const filePath = path.join(__dirname, '..', req.file.path);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
      return res.status(404).json({ success: false, message: 'Warranty not found' });
    }

    // Update text if provided and not empty
    if (text !== undefined) {
      if (!text.trim()) {
        return res.status(400).json({ success: false, message: 'Warranty text cannot be empty' });
      }
      // Optional: check uniqueness (exclude current)
      const existing = await Warranty.findOne({ text: text.trim(), _id: { $ne: id } });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Another warranty with this text already exists' });
      }
      warranty.text = text.trim();
    }

    // Handle logo update
    if (req.file) {
      // Delete old logo file if exists
      if (warranty.logo) {
        deleteOldLogo(warranty.logo);
      }
      warranty.logo = req.file.path.replace(/\\/g, '/');
    }

    await warranty.save();

    res.status(200).json({ success: true, data: warranty });
  } catch (error) {
    console.error('Update warranty error:', error);
    // If new file was uploaded but update fails, delete it
    if (req.file) {
      const filePath = path.join(__dirname, '..', req.file.path);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ success: false, message: 'Invalid warranty ID' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete a warranty (and its associated logo file)
// @route   DELETE /api/warranties/:id
// @access  Private (Admin)
export const deleteWarranty = async (req, res) => {
  try {
    const { id } = req.params;
    const warranty = await Warranty.findById(id);

    if (!warranty) {
      return res.status(404).json({ success: false, message: 'Warranty not found' });
    }

    // Delete logo file if it exists
    if (warranty.logo) {
      deleteOldLogo(warranty.logo);
    }

    await Warranty.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: 'Warranty deleted successfully' });
  } catch (error) {
    console.error('Delete warranty error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ success: false, message: 'Invalid warranty ID' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
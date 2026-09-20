import mongoose from 'mongoose';
import Attribute from '../model/Attribute.js';

// Helper function to clean values array (supports both old string[] and new object[] format)
// packSizes are now stored as an array of strings (trimmed, non-empty)
const cleanValues = (values) => {
  if (!Array.isArray(values)) return [];
  
  // Check if it's the old string format
  if (values.length > 0 && typeof values[0] === 'string') {
    // Convert each string to object with empty packSizes
    return values
      .map(v => (typeof v === 'string' ? v.trim() : ''))
      .filter(v => v !== '')
      .map(value => ({ value, packSizes: [] }));
  }
  
  // New format: array of objects { value, packSizes }
  return values
    .filter(v => v && typeof v === 'object' && v.value && typeof v.value === 'string' && v.value.trim() !== '')
    .map(v => ({
      value: v.value.trim(),
      packSizes: Array.isArray(v.packSizes) 
        ? v.packSizes
            .filter(p => typeof p === 'string' && p.trim() !== '')
            .map(p => p.trim())
        : []
    }));
};

// @desc    Create a new attribute
export const createAttribute = async (req, res) => {
  try {
    const { name, values } = req.body;
    console.log('📥 Received payload:', { name, values });

    // Validate name
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Attribute name is required and must be a non-empty string',
      });
    }

    // Validate values
    if (!values || !Array.isArray(values)) {
      return res.status(400).json({
        success: false,
        message: 'Values must be provided as an array',
      });
    }

    // Clean values (handles both old and new format)
    const cleanedValues = cleanValues(values);
    if (cleanedValues.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one non-empty attribute value is required',
      });
    }

    // Check for duplicate attribute name
    const existing = await Attribute.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Attribute '${name}' already exists`,
      });
    }

    // Create attribute
    const attribute = await Attribute.create({
      name: name.trim(),
      values: cleanedValues,
    });

    console.log('✅ Attribute created:', attribute._id);
    res.status(201).json({ success: true, data: attribute });
  } catch (error) {
    console.error('❌ Error in createAttribute:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Attribute name already exists (duplicate key)',
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: `Validation error: ${messages.join(', ')}`,
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating attribute',
    });
  }
};

// @desc    Get all attributes
export const getAttributes = async (req, res) => {
  try {
    const attributes = await Attribute.find().sort({ name: 1 });
    res.status(200).json({ success: true, count: attributes.length, data: attributes });
  } catch (error) {
    console.error('❌ Error in getAttributes:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching attributes',
    });
  }
};

// @desc    Get single attribute by ID
export const getAttributeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next('route');
    }

    const attribute = await Attribute.findById(id);
    if (!attribute) {
      return res.status(404).json({
        success: false,
        message: 'Attribute not found',
      });
    }
    res.status(200).json({ success: true, data: attribute });
  } catch (error) {
    console.error('❌ Error in getAttributeById:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching attribute',
    });
  }
};

// @desc    Update an attribute
export const updateAttribute = async (req, res) => {
  try {
    const { name, values } = req.body;
    const updateData = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Attribute name cannot be empty',
        });
      }
      updateData.name = name.trim();
    }

    if (values !== undefined) {
      if (!Array.isArray(values)) {
        return res.status(400).json({
          success: false,
          message: 'Values must be an array',
        });
      }
      const cleanedValues = cleanValues(values);
      if (cleanedValues.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one non-empty value is required',
        });
      }
      updateData.values = cleanedValues;
    }

    const attribute = await Attribute.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
      context: 'query',
    });

    if (!attribute) {
      return res.status(404).json({
        success: false,
        message: 'Attribute not found',
      });
    }

    res.status(200).json({ success: true, data: attribute });
  } catch (error) {
    console.error('❌ Error in updateAttribute:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Attribute name already exists',
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: `Validation error: ${messages.join(', ')}`,
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while updating attribute',
    });
  }
};

// @desc    Delete an attribute
export const deleteAttribute = async (req, res) => {
  try {
    const attribute = await Attribute.findByIdAndDelete(req.params.id);
    if (!attribute) {
      return res.status(404).json({
        success: false,
        message: 'Attribute not found',
      });
    }
    res.status(200).json({
      success: true,
      message: 'Attribute deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error in deleteAttribute:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while deleting attribute',
    });
  }
};
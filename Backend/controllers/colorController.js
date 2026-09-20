import Color from '../model/Color.js';

export const getColors = async (req, res) => {
  try {
    const colors = await Color.find().sort({ name: 1 });
    res.json({ success: true, data: colors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getColorById = async (req, res) => {
  try {
    const color = await Color.findById(req.params.id);
    if (!color) return res.status(404).json({ success: false, message: 'Color not found' });
    res.json({ success: true, data: color });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createColor = async (req, res) => {
  try {
    const { name, code } = req.body;
    const existing = await Color.findOne({ name: name.trim() });
    if (existing) return res.status(409).json({ success: false, message: 'Color name already exists' });
    const color = await Color.create({ name: name.trim(), code: code.trim() });
    res.status(201).json({ success: true, data: color });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateColor = async (req, res) => {
  try {
    const { name, code } = req.body;
    const color = await Color.findByIdAndUpdate(
      req.params.id,
      { name: name.trim(), code: code.trim() },
      { new: true, runValidators: true }
    );
    if (!color) return res.status(404).json({ success: false, message: 'Color not found' });
    res.json({ success: true, data: color });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteColor = async (req, res) => {
  try {
    const color = await Color.findByIdAndDelete(req.params.id);
    if (!color) return res.status(404).json({ success: false, message: 'Color not found' });
    res.json({ success: true, message: 'Color deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
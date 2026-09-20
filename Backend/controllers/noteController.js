// controllers/noteController.js
import Note from '../model/Note.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper: delete old image file if it exists
const deleteOldImage = (imagePath) => {
  if (imagePath && imagePath !== '') {
    const fullPath = path.join(__dirname, '..', imagePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }
};

// @desc    Get all notes (with optional filters)
// @route   GET /api/notes
// @access  Private (Admin)
export const getAllNotes = async (req, res) => {
  try {
    const { user, type, sellerCanAccess } = req.query;
    let filter = {};
    if (user) filter.user = user;
    if (type) filter.type = type;
    if (sellerCanAccess !== undefined) filter.sellerCanAccess = sellerCanAccess === 'true';
    
    const notes = await Note.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: notes });
  } catch (error) {
    console.error('Get all notes error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single note by ID
// @route   GET /api/notes/:id
// @access  Private (Admin)
export const getNoteById = async (req, res) => {
  try {
    const { id } = req.params;
    const note = await Note.findById(id);
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }
    res.status(200).json({ success: true, data: note });
  } catch (error) {
    console.error('Get note by ID error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ success: false, message: 'Invalid note ID' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create a new note (with optional image)
// @route   POST /api/notes
// @access  Private (Admin)
export const createNote = async (req, res) => {
  try {
    const { user, type, description, sellerCanAccess } = req.body;
    
    // Validation
    if (!type || !description) {
      return res.status(400).json({ success: false, message: 'Type and description are required' });
    }
    
    let imagePath = null;
    if (req.file) {
      imagePath = req.file.path.replace(/\\/g, '/');
    }
    
    const note = await Note.create({
      user: user || 'In-House',
      type,
      description: description.trim(),
      sellerCanAccess: sellerCanAccess === 'true' || sellerCanAccess === true,
      image: imagePath,
    });
    
    res.status(201).json({ success: true, data: note });
  } catch (error) {
    console.error('Create note error:', error);
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

// @desc    Update a note (text and/or image)
// @route   PUT /api/notes/:id
// @access  Private (Admin)
export const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { user, type, description, sellerCanAccess } = req.body;
    
    const note = await Note.findById(id);
    if (!note) {
      if (req.file) {
        const filePath = path.join(__dirname, '..', req.file.path);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
      return res.status(404).json({ success: false, message: 'Note not found' });
    }
    
    if (user !== undefined) note.user = user;
    if (type !== undefined) note.type = type;
    if (description !== undefined) note.description = description.trim();
    if (sellerCanAccess !== undefined) note.sellerCanAccess = sellerCanAccess === 'true' || sellerCanAccess === true;
    
    if (req.file) {
      if (note.image) deleteOldImage(note.image);
      note.image = req.file.path.replace(/\\/g, '/');
    }
    
    await note.save();
    res.status(200).json({ success: true, data: note });
  } catch (error) {
    console.error('Update note error:', error);
    if (req.file) {
      const filePath = path.join(__dirname, '..', req.file.path);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ success: false, message: 'Invalid note ID' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete a note (and its associated image file)
// @route   DELETE /api/notes/:id
// @access  Private (Admin)
export const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const note = await Note.findById(id);
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }
    
    if (note.image) deleteOldImage(note.image);
    await Note.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Delete note error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ success: false, message: 'Invalid note ID' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
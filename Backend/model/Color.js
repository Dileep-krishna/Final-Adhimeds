import mongoose from 'mongoose';

const colorSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  code: { type: String, required: true, trim: true }, // e.g., "#FFE4E1"
}, { timestamps: true });

export default mongoose.model('Color', colorSchema);
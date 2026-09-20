import mongoose from 'mongoose';

const attributeValueSchema = new mongoose.Schema({
  value: { type: String, required: true, trim: true },
  packSizes: { type: [String], default: [] }
}, { _id: false });

const attributeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  values: { type: [attributeValueSchema], required: true, default: [] }
}, { timestamps: true });

// ✅ Synchronous pre‑save hook – no 'next' parameter
attributeSchema.pre('save', function() {
  if (this.values && this.values.length > 0) {
    if (typeof this.values[0] === 'string') {
      this.values = this.values.map(v => ({ value: v, packSizes: [] }));
    }
  }
  // No next() call – Mongoose will continue automatically
});

export default mongoose.models.Attribute || mongoose.model('Attribute', attributeSchema);
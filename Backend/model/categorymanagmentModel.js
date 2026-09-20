import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    icon: { type: String, default: "" },
    coverImage: { type: String, default: "" },
    banner: { type: String, default: "" },
    order: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    isHot: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    metaTitle: { type: String, default: "", trim: true },
    metaDescription: { type: String, default: "", trim: true },
    metaKeywords: { type: String, default: "", trim: true },

    // ─── Filtering Attributes (array of ObjectId refs) ───
    filteringAttributes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Attribute",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// ─── FIX: Synchronous pre‑validate hook (no 'next') ───
categorySchema.pre('validate', function() {
  if (typeof this.filteringAttributes === 'string') {
    try {
      const parsed = JSON.parse(this.filteringAttributes);
      if (Array.isArray(parsed)) {
        this.filteringAttributes = parsed;
      } else {
        this.filteringAttributes = [];
      }
    } catch (e) {
      // If parsing fails, set to empty array to avoid cast error
      this.filteringAttributes = [];
    }
  }
});

const Category = mongoose.model("Category", categorySchema);
export default Category;
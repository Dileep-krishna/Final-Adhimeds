import Brand from '../model/Brand.js';
import Product from '../model/AddProductPageModel.js';
import XLSX from 'xlsx';
import fs from 'fs';
import mongoose from 'mongoose';

// Helper to get file URL (if Multer saves to /imgUploads)
const getLogoUrl = (file) => {
  if (!file) return null;
  return `/imgUploads/${file.filename}`;
};

// ─── Helper: clean string ───────────────────────────────
const cleanString = (val) => {
  if (typeof val === 'string') return val.trim();
  if (val === null || val === undefined) return '';
  return String(val).trim();
};

// ─── Helper: get value from row (case‑insensitive) ─────
const getValue = (row, aliases) => {
  for (const alias of aliases) {
    if (row[alias] !== undefined && row[alias] !== null && row[alias] !== '') {
      return row[alias];
    }
  }
  return '';
};

// -------------------------------
// 1. GET all brands
// -------------------------------

export const getAllBrands = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const filter = req.query.filter || 'all'; // 'all' or 'unused'

    // Build match stage for search
    const matchStage = {};
    if (search) {
      matchStage.name = { $regex: search, $options: 'i' };
    }

    // Aggregation pipeline
    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'products', // the MongoDB collection name for products (usually pluralized)
          let: { brandName: '$name' },
          pipeline: [
            { $match: { $expr: { $eq: ['$brand', '$$brandName'] } } },
            { $count: 'count' }
          ],
          as: 'productCount'
        }
      },
      {
        $addFields: {
          products: { $ifNull: [{ $arrayElemAt: ['$productCount.count', 0] }, 0] }
        }
      },
      { $project: { productCount: 0 } } // remove temporary field
    ];

    // Apply filter for unused brands (products === 0)
    if (filter === 'unused') {
      pipeline.push({ $match: { products: 0 } });
    }

    // Sort, skip, limit
    pipeline.push({ $sort: { createdAt: -1 } });
    pipeline.push({ $skip: (page - 1) * limit });
    pipeline.push({ $limit: limit });

    // Count total documents matching filter (for pagination)
    let totalCountPipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'products',
          let: { brandName: '$name' },
          pipeline: [
            { $match: { $expr: { $eq: ['$brand', '$$brandName'] } } },
            { $count: 'count' }
          ],
          as: 'productCount'
        }
      },
      {
        $addFields: {
          products: { $ifNull: [{ $arrayElemAt: ['$productCount.count', 0] }, 0] }
        }
      }
    ];
    if (filter === 'unused') {
      totalCountPipeline.push({ $match: { products: 0 } });
    }
    totalCountPipeline.push({ $count: 'total' });

    // Execute both pipelines
    const [brands, totalResult] = await Promise.all([
      Brand.aggregate(pipeline),
      Brand.aggregate(totalCountPipeline)
    ]);

    const total = totalResult.length > 0 ? totalResult[0].total : 0;
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: brands,
      total,
      totalPages,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
// -------------------------------
// 2. GET single brand by ID
// -------------------------------
export const getBrandById = async (req, res) => {
  try {
    const { id } = req.params;
    const brand = await Brand.findById(id);
    if (!brand) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }
    res.status(200).json({ success: true, data: brand });
  } catch (error) {
    console.error('Error fetching brand:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// -------------------------------
// 3. CREATE a new brand
// -------------------------------
export const createBrand = async (req, res) => {
  try {
    const { name, category, metaTitle, metaDescription, metaKeywords } = req.body;
    const logo = req.file ? getLogoUrl(req.file) : null;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Brand name is required' });
    }

    const existing = await Brand.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Brand already exists' });
    }

    const newBrand = new Brand({
      name: name.trim(),
      logo,
      category: category || 'General',
      metaTitle: metaTitle || '',
      metaDescription: metaDescription || '',
      metaKeywords: metaKeywords || '',
    });

    const savedBrand = await newBrand.save();
    res.status(201).json({ success: true, data: savedBrand });
  } catch (error) {
    console.error('Error creating brand:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// -------------------------------
// 4. UPDATE an existing brand
// -------------------------------
export const updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, metaTitle, metaDescription, metaKeywords } = req.body;
    const updateData = {};

    if (name) updateData.name = name.trim();
    if (category) updateData.category = category;
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle;
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription;
    if (metaKeywords !== undefined) updateData.metaKeywords = metaKeywords;

    if (req.file) {
      updateData.logo = getLogoUrl(req.file);
    }

    const updatedBrand = await Brand.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedBrand) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }

    res.status(200).json({ success: true, data: updatedBrand });
  } catch (error) {
    console.error('Error updating brand:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// -------------------------------
// 5. DELETE a brand
// -------------------------------
export const deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedBrand = await Brand.findByIdAndDelete(id);
    if (!deletedBrand) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }
    res.status(200).json({ success: true, message: 'Brand deleted successfully', data: deletedBrand });
  } catch (error) {
    console.error('Error deleting brand:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ============================================================
// BULK IMPORT / EXPORT (ADDED)
// ============================================================

// ─── BULK IMPORT BRANDS ──────────────────────────────────
export const bulkImportBrands = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    fs.unlinkSync(filePath);

    if (!data || data.length === 0) {
      return res.status(400).json({ message: "File is empty or invalid" });
    }

    let imported = 0;
    const errors = [];

    for (const row of data) {
      try {
        const name = cleanString(getValue(row, ["name", "Name", "brandName", "Brand Name"]));
        const logo = cleanString(getValue(row, ["logo", "Logo", "logo_url", "Logo URL"]));
        const category = cleanString(getValue(row, ["category", "Category"])) || "General";
        const metaTitle = cleanString(getValue(row, ["meta_title", "metaTitle", "Meta Title", "meta title"]));
        const metaDescription = cleanString(getValue(row, ["meta_description", "metaDescription", "Meta Description", "meta description"]));
        const metaKeywords = cleanString(getValue(row, ["meta_keywords", "metaKeywords", "Meta Keywords", "meta keywords"]));

        if (!name) {
          errors.push({ row, error: "Brand name is required" });
          continue;
        }

        // Check for duplicate (case‑insensitive)
        const existing = await Brand.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
        if (existing) {
          errors.push({ row, error: `Brand "${name}" already exists, skipped` });
          continue;
        }

        const brandData = {
          name,
          logo: logo || "",
          category,
          metaTitle: metaTitle || "",
          metaDescription: metaDescription || "",
          metaKeywords: metaKeywords || "",
        };

        const brand = new Brand(brandData);
        await brand.save();
        imported++;
      } catch (err) {
        console.error("Error importing row:", err);
        errors.push({ row, error: err.message });
      }
    }

    res.status(200).json({
      message: `Imported ${imported} brands`,
      imported,
      errors,
    });
  } catch (error) {
    console.error("🔥 Brand bulk import error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─── BULK EXPORT BRANDS ──────────────────────────────────
export const bulkExportBrands = async (req, res) => {
  try {
    const brands = await Brand.find().lean();

    if (!brands || brands.length === 0) {
      return res.status(404).json({ message: "No brands found" });
    }

    const exportData = brands.map((b) => ({
      "Name": b.name,
      "Logo": b.logo || "",
      "Category": b.category || "General",
      "Meta Title": b.metaTitle || "",
      "Meta Description": b.metaDescription || "",
      "Meta Keywords": b.metaKeywords || "",
      "Created At": b.createdAt ? new Date(b.createdAt).toLocaleDateString() : "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Brands");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Disposition", 'attachment; filename="brands_export.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);
  } catch (error) {
    console.error("Brand export error:", error);
    res.status(500).json({ message: error.message });
  }
};
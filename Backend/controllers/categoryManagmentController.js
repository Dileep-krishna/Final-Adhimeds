import mongoose from "mongoose";
import Category from "../model/categorymanagmentModel.js";
import XLSX from "xlsx";
import fs from "fs";
import Attribute from "../model/Attribute.js";

// ─── Helper: parse filteringAttributes ───
const parseFilteringAttributes = (input) => {
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) {
        return parsed.filter(id => mongoose.Types.ObjectId.isValid(id));
      }
    } catch {}
    return [];
  }
  if (Array.isArray(input)) {
    return input.filter(id => mongoose.Types.ObjectId.isValid(id));
  }
  return [];
};

// ================= CREATE CATEGORY (FIXED) =================
export const createCategory = async (req, res) => {
  try {
    const {
      name,
      type,
      parent,
      order,
      isFeatured,
      isHot,
      status,
      metaTitle,
      metaDescription,
      metaKeywords,
      filteringAttributes,
    } = req.body;

    // ─── Parse filteringAttributes ───
    const validAttributes = parseFilteringAttributes(filteringAttributes);

    const newCategory = new Category({
      name,
      type: type || undefined,
      parent: parent || null,
      order: order || 0,
      isFeatured: isFeatured || false,
      isHot: isHot || false,
      status: status || "active",
      metaTitle: metaTitle || "",
      metaDescription: metaDescription || "",
      metaKeywords: metaKeywords || "",
      filteringAttributes: validAttributes,
      icon: req.files?.icon?.[0]?.filename || "",
      coverImage: req.files?.coverImage?.[0]?.filename || "",
      banner: req.files?.banner?.[0]?.filename || "",
    });

    await newCategory.save();

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: newCategory,
    });
  } catch (error) {
    console.error("🔥 Create category error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ================= GET ALL CATEGORIES (with pagination & search) =================
export const getCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const filter = {};
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    const total = await Category.countDocuments(filter);

    const categories = await Category.find(filter)
      .populate("parent", "name")
      .sort({ order: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      data: categories,
      total,
      totalPages,
      page,
      limit,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= GET SINGLE CATEGORY =================
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate("parent", "name");

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= UPDATE CATEGORY =================
export const updateCategory = async (req, res) => {
  try {
    const {
      name,
      type,
      parent,
      order,
      isFeatured,
      isHot,
      status,
      metaTitle,
      metaDescription,
      metaKeywords,
      filteringAttributes,
    } = req.body;

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    let parentValue = parent;
    if (parentValue === "null" || parentValue === "") {
      parentValue = null;
    }

    // ─── Parse filteringAttributes ───
    const validAttributes = parseFilteringAttributes(filteringAttributes);

    // ─── Update fields ───
    if (name !== undefined) category.name = name;
    if (type !== undefined) category.type = type;
    category.parent = parentValue;
    if (order !== undefined) category.order = order;
    if (isFeatured !== undefined) category.isFeatured = isFeatured;
    if (isHot !== undefined) category.isHot = isHot;
    if (status !== undefined) category.status = status;
    if (metaTitle !== undefined) category.metaTitle = metaTitle;
    if (metaDescription !== undefined) category.metaDescription = metaDescription;
    if (metaKeywords !== undefined) category.metaKeywords = metaKeywords;
    if (filteringAttributes !== undefined) {
      category.filteringAttributes = validAttributes;
    }

    if (req.files?.icon) category.icon = req.files.icon[0].filename;
    if (req.files?.coverImage) category.coverImage = req.files.coverImage[0].filename;
    if (req.files?.banner) category.banner = req.files.banner[0].filename;

    await category.save();

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= DELETE CATEGORY =================
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= BULK IMPORT =================
export const bulkImportCategories = async (req, res) => {
  console.log("🚀 bulkImportCategories called");

  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const filePath = req.file.path;
    console.log("📂 File path:", filePath);

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    fs.unlinkSync(filePath);

    if (!data || data.length === 0) {
      return res.status(400).json({ message: "File is empty or invalid" });
    }

    console.log(`📊 Parsed ${data.length} rows`);

    let imported = 0;
    const errors = [];

    const getValue = (row, aliases) => {
      for (const alias of aliases) {
        const val = row[alias];
        if (val !== undefined && val !== null && val !== "") {
          return val;
        }
      }
      return "";
    };

    const resolveAttributeId = async (input) => {
      if (mongoose.Types.ObjectId.isValid(input)) return input;
      try {
        const attr = await Attribute.findOne({
          name: { $regex: new RegExp(`^${input}$`, "i") }
        });
        return attr ? attr._id : null;
      } catch {
        return null;
      }
    };

    const parseAttributeIds = (raw) => {
      if (!raw) return [];
      let cleaned = String(raw).trim();
      if (cleaned === '[]' || cleaned === "[ '[]' ]" || cleaned === '["[]"]' || cleaned === "['[]']") return [];
      if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
        cleaned = cleaned.slice(1, -1);
      }
      if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
        try {
          const parsed = JSON.parse(cleaned);
          if (Array.isArray(parsed)) {
            return parsed.map(item => String(item).trim()).filter(item => item && item !== '[]');
          }
        } catch {}
      }
      cleaned = cleaned.replace(/^\[|\]$/g, '');
      return cleaned.split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(item => item && item !== '[]' && item !== '');
    };

    for (const row of data) {
      try {
        const name = getValue(row, ["Name*", "Name", "name"]);
        const parent = getValue(row, ["Parent ID", "Parent", "parent", "parentId"]);
        const order = parseInt(getValue(row, ["Order", "order"])) || 0;
        const metaTitle = getValue(row, ["Meta Title", "metaTitle"]);
        const metaDescription = getValue(row, ["Meta Description", "metaDescription"]);
        const metaKeywords = getValue(row, ["Meta Keywords", "metaKeywords"]);
        const featured = getValue(row, ["Featured", "featured", "isFeatured"]);
        const hot = getValue(row, ["Hot", "hot", "isHot"]);
        const status = getValue(row, ["Status", "status"]);

        const attrStr = getValue(row, ["Attribute IDs", "Attribute ID", "attributeIds", "attributes"]);
        const attrParts = parseAttributeIds(attrStr);
        const attributeIds = [];
        for (const part of attrParts) {
          const resolved = await resolveAttributeId(part);
          if (resolved) {
            attributeIds.push(resolved);
          } else {
            console.warn(`⚠️ Attribute "${part}" not found, skipping`);
          }
        }

        const validAttributeIds = attributeIds.filter(id => mongoose.Types.ObjectId.isValid(id));

        if (!name) {
          errors.push({ row, error: "Name is required" });
          continue;
        }

        const categoryData = {
          name,
          order,
          metaTitle: metaTitle || "",
          metaDescription: metaDescription || "",
          metaKeywords: metaKeywords || "",
          isFeatured: featured === "Yes" || featured === "true" || featured === true,
          isHot: hot === "Yes" || hot === "true" || hot === true,
          status: status || "active",
          filteringAttributes: validAttributeIds,
        };

        if (parent) {
          let parentId = null;
          if (mongoose.Types.ObjectId.isValid(parent)) {
            const parentCat = await Category.findById(parent);
            if (parentCat) parentId = parentCat._id;
          } else {
            const parentCat = await Category.findOne({ name: parent });
            if (parentCat) parentId = parentCat._id;
          }
          if (parentId) {
            categoryData.parent = parentId;
          } else {
            errors.push({ row, error: `Parent '${parent}' not found, skipped` });
          }
        }

        console.log(`📦 Saving: ${name}`);
        const category = new Category(categoryData);
        await category.save();
        imported++;
      } catch (err) {
        console.error("❌ Row error:", err);
        errors.push({ row, error: err.message });
      }
    }

    res.status(200).json({
      message: `Imported ${imported} categories`,
      imported,
      errors,
    });
  } catch (error) {
    console.error("🔥 Fatal bulk import error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ================= BULK EXPORT =================
export const bulkExportCategories = async (req, res) => {
  try {
    const categories = await Category.find()
      .populate("parent", "name")
      .lean();

    if (!categories || categories.length === 0) {
      return res.status(404).json({ message: "No categories found" });
    }

    const exportData = categories.map((cat) => ({
      "ID": cat._id.toString(),
      "Name": cat.name,
      "Parent": cat.parent?.name || "",
      "Order": cat.order || 0,
      "Featured": cat.isFeatured ? "Yes" : "No",
      "Hot": cat.isHot ? "Yes" : "No",
      "Status": cat.status || "active",
      "Meta Title": cat.metaTitle || "",
      "Meta Description": cat.metaDescription || "",
      "Meta Keywords": cat.metaKeywords || "",
      "Created At": cat.createdAt ? new Date(cat.createdAt).toLocaleDateString() : "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Categories");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Disposition", 'attachment; filename="categories_export.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ================= DOWNLOAD TEMPLATE =================
export const downloadTemplate = async (req, res) => {
  try {
    const categories = await Category.find().select("_id name parent").lean();
    const categoryData = categories.map((cat) => ({
      "Category ID": cat._id.toString(),
      "Name": cat.name,
      "Parent ID": cat.parent?._id || cat.parent || "",
    }));

    const attributeData = [
      { "Attribute ID": "attr_1", "Name": "Size" },
      { "Attribute ID": "attr_2", "Name": "Color" },
      { "Attribute ID": "attr_3", "Name": "Fabric" },
    ];

    const templateData = [
      {
        "Name*": "Electronics",
        "Parent ID": "cat_abc123",
        "Order": 1,
        "Meta Title": "Electronics",
        "Meta Description": "All electronics products",
        "Meta Keywords": "electronics, gadgets",
        "Attribute IDs": "attr_1, attr_2",
      },
    ];

    const wb = XLSX.utils.book_new();
    const wsCat = XLSX.utils.json_to_sheet(categoryData);
    XLSX.utils.book_append_sheet(wb, wsCat, "Category Reference");

    const wsAttr = XLSX.utils.json_to_sheet(attributeData);
    XLSX.utils.book_append_sheet(wb, wsAttr, "Attribute Reference");

    const wsTemplate = XLSX.utils.json_to_sheet(templateData);
    XLSX.utils.book_append_sheet(wb, wsTemplate, "Import Template");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Disposition", 'attachment; filename="category_reference_data.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
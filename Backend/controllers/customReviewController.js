import Product from '../model/AddProductPageModel.js';
import CustomReview from '../model/CustomReview.js';
// adjust relative path if needed

// Helper: Update product's average rating and total reviews
const updateProductRating = async (productId) => {
  const result = await CustomReview.aggregate([
    { $match: { productId: productId, status: 'active' } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, total: { $sum: 1 } } }
  ]);
  const avgRating = result.length ? parseFloat(result[0].avgRating.toFixed(1)) : 0;
  const totalReviews = result.length ? result[0].total : 0;
  await Product.findByIdAndUpdate(productId, { averageRating: avgRating, totalReviews });
  return { avgRating, totalReviews };
};

// ------------------- CREATE -------------------
export const createCustomReview = async (req, res) => {
  try {
    const { reviewerName, categoryId, productId, rating, dateOption, reviewDate, comment } = req.body;

    // Files come from multer fields: 'reviewerImage' and 'newImages'
    let reviewerImageUrl = '';
    if (req.files?.reviewerImage) {
      const file = req.files.reviewerImage[0];
      reviewerImageUrl = `${file.destination}/${file.filename}`; // e.g., "imgUploads/image-123.jpg"
    }
    let imageUrls = [];
    if (req.files?.newImages) {
      imageUrls = req.files.newImages.map(file => `${file.destination}/${file.filename}`);
    }

    let finalDate = null;
    if (dateOption === 'manual' && reviewDate) {
      finalDate = new Date(reviewDate);
    }

    const newReview = new CustomReview({
      reviewerName,
      reviewerImage: reviewerImageUrl,
      categoryId,
      productId,
      rating,
      reviewDate: finalDate,
      comment,
      images: imageUrls,
      isCustom: true,
    });

    await newReview.save();
    await updateProductRating(productId);
    res.status(201).json({ success: true, data: newReview });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ------------------- GET ALL (with filters) -------------------
export const getAllCustomReviews = async (req, res) => {
  try {
    const { productId, categoryId, status } = req.query;
    const filter = {};
    if (productId) filter.productId = productId;
    if (categoryId) filter.categoryId = categoryId;
    if (status) filter.status = status;

    const reviews = await CustomReview.find(filter)
      .populate('productId', 'name')
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ------------------- GET SINGLE -------------------
export const getCustomReviewById = async (req, res) => {
  try {
    const review = await CustomReview.findById(req.params.id)
      .populate('productId', 'name')
      .populate('categoryId', 'name');
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    res.json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ------------------- UPDATE -------------------
export const updateCustomReview = async (req, res) => {
  try {
    const review = await CustomReview.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    const { reviewerName, categoryId, productId, rating, dateOption, reviewDate, comment, existingImages } = req.body;

    // Update text fields
    review.reviewerName = reviewerName || review.reviewerName;
    review.categoryId = categoryId || review.categoryId;
    review.productId = productId || review.productId;
    review.rating = rating || review.rating;
    review.comment = comment || review.comment;

    if (dateOption === 'manual' && reviewDate) {
      review.reviewDate = new Date(reviewDate);
    } else if (dateOption === 'system') {
      review.reviewDate = null;
    }

    // Update reviewer image if new file uploaded
    if (req.files?.reviewerImage) {
      const file = req.files.reviewerImage[0];
      review.reviewerImage = `${file.destination}/${file.filename}`;
    }

    // Add new additional images
    if (req.files?.newImages) {
      const newImageUrls = req.files.newImages.map(file => `${file.destination}/${file.filename}`);
      review.images.push(...newImageUrls);
    }

    // Handle existing images (keep only those listed in existingImages JSON array)
    if (existingImages) {
      const keepImages = JSON.parse(existingImages);
      review.images = review.images.filter(img => keepImages.includes(img));
    }

    await review.save();
    const finalProductId = productId || review.productId;
    await updateProductRating(finalProductId);
    res.json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ------------------- DELETE -------------------
export const deleteCustomReview = async (req, res) => {
  try {
    const review = await CustomReview.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    await updateProductRating(review.productId);
    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
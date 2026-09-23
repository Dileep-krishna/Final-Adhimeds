import CustomerReviewVideo from "../model/CustomerReviewVideo.js";


// ADD CUSTOMER REVIEW VIDEO
export const addCustomerReviewVideo = async (req, res) => {
  try {
    const {
      customerName,
      customerLocation,
      title,
      review,
      videoUrl,
      thumbnail,
      rating,
      order,
    } = req.body;

    if (!customerName || !videoUrl) {
      return res.status(400).json({
        success: false,
        message: "Customer name and video URL are required",
      });
    }

    const video = new CustomerReviewVideo({
      customerName,
      customerLocation: customerLocation || "",
      title: title || "",
      review: review || "",
      videoUrl,
      thumbnail: thumbnail || "",
      rating: rating || 5,
      order: order || 0,
    });

    const savedVideo = await video.save();

    res.status(201).json({
      success: true,
      message: "Customer review video added successfully",
      data: savedVideo,
    });
  } catch (error) {
    console.error("Error adding customer review video:", error);

    res.status(500).json({
      success: false,
      message: "Failed to add customer review video",
      error: error.message,
    });
  }
};


// GET CUSTOMER REVIEW VIDEOS
export const getCustomerReviewVideos = async (req, res) => {
  try {
    const videos = await CustomerReviewVideo.find({
      isActive: true,
    })
      .sort({ order: 1, createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      message: "Customer review videos fetched successfully",
      total: videos.length,
      data: videos,
    });
  } catch (error) {
    console.error("Error fetching customer review videos:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch customer review videos",
      error: error.message,
    });
  }
};
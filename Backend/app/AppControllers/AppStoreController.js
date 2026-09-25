import MedicalStore from "../../model/MedicalstoreManagementModel.js";

// =====================================================
// GET NEARBY STORES
// GET /api/app/stores/nearby?latitude=10.1147&longitude=76.4767
// =====================================================

export const getNearbyStores = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "latitude and longitude are required",
      });
    }

    const userLat = Number(latitude);
    const userLng = Number(longitude);

    if (Number.isNaN(userLat) || Number.isNaN(userLng)) {
      return res.status(400).json({
        success: false,
        message: "Invalid latitude or longitude",
      });
    }

    if (userLat < -90 || userLat > 90) {
      return res.status(400).json({
        success: false,
        message: "Invalid latitude",
      });
    }

    if (userLng < -180 || userLng > 180) {
      return res.status(400).json({
        success: false,
        message: "Invalid longitude",
      });
    }

    const stores = await MedicalStore.find({
      status: "active",
      latitude: { $exists: true },
      longitude: { $exists: true },
    })
      .select("-password")
      .lean();

    // Calculate distance using latitude/longitude
    const storesWithDistance = stores.map((store) => {
      const storeLat = Number(store.latitude);
      const storeLng = Number(store.longitude);

      const R = 6371; // Earth radius in KM

      const dLat =
        ((storeLat - userLat) * Math.PI) / 180;

      const dLng =
        ((storeLng - userLng) * Math.PI) / 180;

      const a =
        Math.sin(dLat / 2) *
          Math.sin(dLat / 2) +
        Math.cos((userLat * Math.PI) / 180) *
          Math.cos((storeLat * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);

      const c =
        2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      const distance = R * c;

      return {
        ...store,
        distanceInKm: Number(distance.toFixed(2)),
      };
    });

    // Nearest store first
    storesWithDistance.sort(
      (a, b) => a.distanceInKm - b.distanceInKm
    );

    return res.status(200).json({
      success: true,
      message: "Nearby stores fetched successfully",
      customerLocation: {
        latitude: userLat,
        longitude: userLng,
      },
      count: storesWithDistance.length,
      stores: storesWithDistance,
    });
  } catch (error) {
    console.error("Get Nearby Stores Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch nearby stores",
      error: error.message,
    });
  }
};


// =====================================================
// GET FEATURED PHARMACIES
// GET /api/app/stores/featured
// =====================================================

export const getFeaturedStores = async (req, res) => {
  try {
    const stores = await MedicalStore.find({
      isFeatured: true,
      status: "active",
    })
      .select("-password")
      .sort({ updatedAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Featured pharmacies fetched successfully",
      count: stores.length,
      stores,
    });
  } catch (error) {
    console.error("Get Featured Stores Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch featured pharmacies",
      error: error.message,
    });
  }
};
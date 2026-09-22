import AppAddress from "../model/AppAddress.js";

export const addAddress = async (req, res) => {
  try {
    const {
      addressTitle,
      name,
      phone,
      house,
      street,
      city,
      district,
      state,
      pincode,
      latitude,
      longitude,
      addressType,
      isDefault,
    } = req.body;

    // If this address is set as default,
    // remove default from other addresses
    if (isDefault === true || isDefault === "true") {
      await AppAddress.updateMany(
        {
          userId: req.appUser._id,
        },
        {
          $set: {
            isDefault: false,
          },
        }
      );
    }

    const newAddress = await AppAddress.create({
      userId: req.appUser._id,

      addressTitle: addressTitle || "",
      name: name || "",
      phone: phone || "",
      house: house || "",
      street: street || "",
      city: city || "",
      district: district || "",
      state: state || "",
      pincode: pincode || "",

      latitude:
        latitude !== undefined ? Number(latitude) : null,

      longitude:
        longitude !== undefined ? Number(longitude) : null,

      addressType: addressType || "home",

      isDefault:
        isDefault === true ||
        isDefault === "true",

      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Address added successfully",
      data: newAddress,
    });
  } catch (error) {
    console.error("Add Address Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add address",
      error: error.message,
    });
  }
};

   
export const getAddresses = async (req, res) => {
  try {
    const addresses = await AppAddress.find({
      userId: req.appUser._id,
    }).sort({
      isDefault: -1,
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      message: "Addresses fetched successfully",
      data: addresses,
    });
  } catch (error) {
    console.error("Get Addresses Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch addresses",
      error: error.message,
    });
  }
};

export const getAddressById = async (req, res) => {
  try {
    const address = await AppAddress.findOne({
      _id: req.params.id,
      userId: req.appUser._id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: address,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch address",
      error: error.message,
    });
  }
};

export const updateAddress = async (req, res) => {
  try {
    const {
      addressTitle,
      name,
      phone,
      house,
      street,
      city,
      district,
      state,
      pincode,
      latitude,
      longitude,
      addressType,
      isDefault,
    } = req.body;

    const address = await AppAddress.findOne({
      _id: req.params.id,
      userId: req.appUser._id,
      isActive: true,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    // If setting this address as default
    if (isDefault === true || isDefault === "true") {
      await AppAddress.updateMany(
        {
          userId: req.appUser._id,
          _id: { $ne: address._id },
          isActive: true,
        },
        {
          $set: {
            isDefault: false,
          },
        }
      );

      address.isDefault = true;
    }

    // Update only fields that were sent
    if (addressTitle !== undefined) {
      address.addressTitle = addressTitle;
    }

    if (name !== undefined) {
      address.name = name;
    }

    if (phone !== undefined) {
      address.phone = phone;
    }

    if (house !== undefined) {
      address.house = house;
    }

    if (street !== undefined) {
      address.street = street;
    }

    if (city !== undefined) {
      address.city = city;
    }

    if (district !== undefined) {
      address.district = district;
    }

    if (state !== undefined) {
      address.state = state;
    }

    if (pincode !== undefined) {
      address.pincode = pincode;
    }

    if (latitude !== undefined) {
      address.latitude = Number(latitude);
    }

    if (longitude !== undefined) {
      address.longitude = Number(longitude);
    }

    if (addressType !== undefined) {
      address.addressType = addressType;
    }

    if (
      isDefault !== undefined &&
      isDefault !== true &&
      isDefault !== "true"
    ) {
      address.isDefault = false;
    }

    await address.save();

    return res.status(200).json({
      success: true,
      message: "Address updated successfully",
      data: address,
    });
  } catch (error) {
    console.error("Update Address Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update address",
      error: error.message,
    });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const address = await AppAddress.findOne({
      _id: req.params.id,
      userId: req.appUser._id,
      isActive: true,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    const wasDefault = address.isDefault;

    address.isActive = false;
    address.isDefault = false;

    await address.save();

    // If deleted address was default,
    // make another active address default
    if (wasDefault) {
      const anotherAddress = await AppAddress.findOne({
        userId: req.appUser._id,
        isActive: true,
      }).sort({
        createdAt: -1,
      });

      if (anotherAddress) {
        anotherAddress.isDefault = true;
        await anotherAddress.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    console.error("Delete Address Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete address",
      error: error.message,
    });
  }
};
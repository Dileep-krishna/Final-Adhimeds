import mongoose from "mongoose";

const connection = async () => {
  try {
    await mongoose.connect(process.env.DATABASE);
    console.log("Mongo connected successfully");
  } catch (err) {
    console.log("Failed due to:", err);
  }
};

export default connection;
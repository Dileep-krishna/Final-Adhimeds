// hashAdminPassword.js
import dotenv from "dotenv";
dotenv.config();
import bcrypt from 'bcryptjs';
import connection from "./connection.js";
import Admin from "./model/Admin.js";

const hashAdmin = async () => {
  await connection();
  const admin = await Admin.findOne({ email: "admin@adhimeds.com" }).select('+password');
  if (!admin) {
    console.log("Admin not found");
    process.exit(1);
  }
  // If already hashed, skip
  if (admin.password.startsWith('$2')) {
    console.log("Password already hashed");
    process.exit(0);
  }
  const hashed = await bcrypt.hash("Admin@123", 10);
  admin.password = hashed;
  await admin.save();
  console.log("✅ Password hashed");
  process.exit(0);
};
hashAdmin();
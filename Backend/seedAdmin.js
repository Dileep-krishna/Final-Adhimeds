import dotenv from "dotenv";
dotenv.config();
import connection from "./connection.js";
import Admin from "./model/Admin.js";

const seedAdmin = async () => {
  await connection();
  const existing = await Admin.findOne({ email: "admin@adhimeds.com" });
  if (existing) {
    console.log("Admin already exists");
    process.exit(0);
  }
  await Admin.create({
    name: "Super Admin",
    email: "admin@adhimeds.com",
    password: "Admin@123",
    role: "super-admin",
    isActive: true,
  });
  console.log("✅ Admin created: admin@adhimeds.com / Admin@123");
  process.exit(0);
};
seedAdmin();
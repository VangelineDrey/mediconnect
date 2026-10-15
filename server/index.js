const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

dotenv.config();
const connectToDB = require("./config/connectToDB");

const app = express();
const PORT = process.env.PORT || 8001;

const start = async () => {
  try {
    await connectToDB();

    // One-time migration: legacy `type` / `isdoctor` fields -> `role` / `doctorStatus`.
    const migrateRoles = require("./scripts/migrateRoles");
    await migrateRoles();

    // Safety net: keep role / doctorStatus / doctors.status consistent.
    const repairDoctorStatus = require("./scripts/repairDoctorStatus");
    await repairDoctorStatus();

    // Seed a default admin account if none exists (useful for initial setup).
    const userModel = require("./schemas/userModel");
    const bcrypt = require("bcryptjs");
    const adminExists = await userModel.findOne({ role: "admin" });
    if (!adminExists) {
      const hashed = await bcrypt.hash("admin123", 10);
      await userModel.create({
        fullName: "Admin",
        email: "admin@mediconnect.com",
        password: hashed,
        phone: "0000000000",
        role: "admin",
        doctorStatus: "none",
      });
      console.log(
        "Seeded default admin: admin@mediconnect.com / admin123"
      );
    }

    // middlewares
    app.use(express.json());
    app.use(cors());
    app.use("/uploads", express.static(path.join(__dirname, "uploads")));

    app.use("/api/user", require("./routes/userRoutes"));
    app.use("/api/admin", require("./routes/adminRoutes"));
    app.use("/api/doctor", require("./routes/doctorRoutes"));

    // error handler
    app.use((err, req, res, next) => {
      console.error(err);
      res.status(500).json({ message: "Something went wrong", success: false });
    });

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

start();
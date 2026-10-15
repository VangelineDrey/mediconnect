const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");
const {
  updateDoctorProfileController,
  getAllDoctorAppointmentsController,
  handleStatusController,
  documentDownloadController,
} = require("../controllers/doctorController");

const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`),
});
const upload = multer({ storage });

const doctorOnly = [authMiddleware, requireRole("doctor")];

router.post("/updateprofile", ...doctorOnly, updateDoctorProfileController);
router.get("/getdoctorappointments", ...doctorOnly, getAllDoctorAppointmentsController);
router.post("/handlestatus", ...doctorOnly, handleStatusController);
router.get("/getdocumentdownload", ...doctorOnly, documentDownloadController);

module.exports = router;
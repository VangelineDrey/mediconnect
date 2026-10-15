const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");
const {
  registerController,
  registerDoctorController,
  loginController,
  authController,
  docController,
  getallnotificationController,
  deleteallnotificationController,
  getAllDoctorsControllers,
  appointmentController,
  getAllUserAppointments,
  cancelAppointmentController,
  getDocsController,
} = require("../controllers/userController");

const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`),
});
const upload = multer({ storage });

// Public
router.post("/register", registerController);
router.post("/registerdoctor", registerDoctorController);
router.post("/login", loginController);

// Authenticated (any role)
router.post("/getuserdata", authMiddleware, authController);
router.get("/getalldoctorsu", authMiddleware, getAllDoctorsControllers);
router.post(
  "/getappointment",
  authMiddleware,
  requireRole("patient"),
  upload.single("image"),
  appointmentController
);
router.post("/getallnotification", authMiddleware, getallnotificationController);
router.post("/deleteallnotification", authMiddleware, deleteallnotificationController);
router.get("/getuserappointments", authMiddleware, getAllUserAppointments);
router.put(
  "/appointments/:id/cancel",
  authMiddleware,
  requireRole("patient"),
  cancelAppointmentController
);
router.get("/getDocsforuser", authMiddleware, getDocsController);

// Patient-only: apply to become a doctor
router.post("/registerdoc", authMiddleware, requireRole("patient"), docController);

module.exports = router;
const express = require("express");
const router = express.Router();
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");
const {
  getAllUsersControllers,
  getUserController,
  createUserController,
  updateUserController,
  deleteUserController,
  getAllDoctorsControllers,
  getDoctorController,
  updateDoctorController,
  deleteDoctorController,
  getStatusApproveController,
  getStatusRejectController,
  displayAllAppointmentController,
  getAppointmentController,
  updateAppointmentController,
  deleteAppointmentController,
} = require("../controllers/adminController");

// Every admin endpoint requires a valid token AND the admin role.
const adminOnly = [authMiddleware, requireRole("admin")];

/* Users */
router.get("/getallusers", ...adminOnly, getAllUsersControllers);
router.get("/users/:id", ...adminOnly, getUserController);
router.post("/users", ...adminOnly, createUserController);
router.put("/users/:id", ...adminOnly, updateUserController);
router.delete("/users/:id", ...adminOnly, deleteUserController);

/* Doctors */
router.get("/getalldoctors", ...adminOnly, getAllDoctorsControllers);
router.post("/getapprove", ...adminOnly, getStatusApproveController);
router.post("/getreject", ...adminOnly, getStatusRejectController);
router.get("/doctors/:id", ...adminOnly, getDoctorController);
router.put("/doctors/:id", ...adminOnly, updateDoctorController);
router.delete("/doctors/:id", ...adminOnly, deleteDoctorController);

/* Appointments */
router.get("/getallAppointmentsAdmin", ...adminOnly, displayAllAppointmentController);
router.get("/appointments/:id", ...adminOnly, getAppointmentController);
router.put("/appointments/:id", ...adminOnly, updateAppointmentController);
router.delete("/appointments/:id", ...adminOnly, deleteAppointmentController);

module.exports = router;
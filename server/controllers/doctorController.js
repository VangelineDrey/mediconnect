const docModel = require("../schemas/docModel");
const appointmentModel = require("../schemas/appointmentModel");
const userModel = require("../schemas/userModel");
const path = require("path");
const fs = require("fs");

const updateDoctorProfileController = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId;
    const doctor = await docModel.findOneAndUpdate(
      { userId },
      { ...req.body },
      { returnDocument: "after" }
    );
    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor profile not found" });
    }
    return res
      .status(200)
      .json({ success: true, message: "Profile updated", data: doctor });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update profile" });
  }
};

const getAllDoctorAppointmentsController = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId;
    const doctor = await docModel.findOne({ userId });
    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }
    const appointments = await appointmentModel.find({ doctorId: doctor._id });
    return res.status(200).json({ success: true, data: appointments });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch appointments" });
  }
};

const handleStatusController = async (req, res) => {
  try {
    const { appointId, status } = req.body;
    const appointment = await appointmentModel.findByIdAndUpdate(
      appointId,
      { status },
      { returnDocument: "after" }
    );
    if (!appointment) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    const user = await userModel.findById(appointment.userId);
    if (user) {
      user.notification.push({
        type: "appointment-status",
        message: `Your appointment has been ${status}`,
        data: { appointmentId: appointment._id, status },
        onClickPath: "/userhome",
      });
      await user.save();
    }

    return res
      .status(200)
      .json({ success: true, message: "Status updated", data: appointment });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update status" });
  }
};

const documentDownloadController = async (req, res) => {
  try {
    const appointId = req.query.appointId || req.body.appointId;
    const appointment = await appointmentModel.findById(appointId);
    if (!appointment || !appointment.document) {
      return res
        .status(404)
        .json({ success: false, message: "Document not found" });
    }
    const filePath = path.resolve(appointment.document.path);
    if (!fs.existsSync(filePath)) {
      return res
        .status(404)
        .json({ success: false, message: "File not found on server" });
    }
    return res.download(filePath, appointment.document.filename);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to download document" });
  }
};

module.exports = {
  updateDoctorProfileController,
  getAllDoctorAppointmentsController,
  handleStatusController,
  documentDownloadController,
};
const bcrypt = require("bcryptjs");
const userModel = require("../schemas/userModel");
const docModel = require("../schemas/docModel");
const appointmentModel = require("../schemas/appointmentModel");

const APPROVAL_STATUSES = ["approved", "rejected"];

/* ------------------------------------------------------------------ *
 * Users
 * ------------------------------------------------------------------ */

/** GET /api/admin/getallusers - read */
const getAllUsersControllers = async (req, res) => {
  try {
    const users = await userModel.find().select("-password").sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: users });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch users" });
  }
};

/** GET /api/admin/users/:id - read one */
const getUserController = async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch user" });
  }
};

/** POST /api/admin/users - create */
const createUserController = async (req, res) => {
  try {
    const { fullName, email, password, phone, role, doctorStatus } = req.body;

    if (!fullName || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: "fullName, email, password and phone are required",
      });
    }

    const existing = await userModel.findOne({ email });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "A user with that email exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await userModel.create({
      fullName,
      email,
      password: hashed,
      phone,
      role: role || "patient",
      doctorStatus: doctorStatus || "none",
    });

    const created = user.toObject();
    delete created.password;
    return res.status(201).json({
      success: true,
      message: "User created",
      data: created,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to create user" });
  }
};

/** PUT /api/admin/users/:id - update (reverse write-through to the doctor profile) */
const updateUserController = async (req, res) => {
  try {
    const { fullName, email, phone, role, doctorStatus, password } = req.body;

    const user = await userModel.findById(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const doctorProfile = await docModel.findOne({ userId: user._id });

    // Integrity guard: the doctor role is only meaningful alongside a profile.
    if (role === "doctor" && !doctorProfile) {
      return res.status(400).json({
        success: false,
        message:
          "This account has no doctor profile. Approve a doctor application from the Doctors tab to grant the doctor role.",
      });
    }

    if (email && email !== user.email) {
      const clash = await userModel.findOne({ email, _id: { $ne: user._id } });
      if (clash) {
        return res
          .status(400)
          .json({ success: false, message: "A user with that email exists" });
      }
      user.email = email;
    }

    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;
    if (password) user.password = await bcrypt.hash(password, 10);

    /**
     * Role and application status are not independent: the patient-facing
     * doctor list filters on doctors.status, so they can never drift apart.
     * Invariant enforced here:
     *   role === "doctor"  <=>  doctorStatus === "approved"
     *                         <=>  doctors.status === "approved"
     */
    let requestedRole = role || user.role;
    let requestedDoctorStatus =
      doctorStatus || (requestedRole === "doctor" ? "approved" : user.doctorStatus);

    // Holding the doctor role means the account is verified.
    if (requestedRole === "doctor") requestedDoctorStatus = "approved";
    // Losing the role retires the application.
    if (requestedRole !== "doctor" && requestedDoctorStatus === "approved") {
      requestedDoctorStatus = "rejected";
    }

    user.role = requestedRole;
    user.doctorStatus = requestedDoctorStatus;
    await user.save();

    // Reverse write-through: keep the doctor profile in sync with the account.
    let profileSynced = false;
    let profileStatusChanged = false;
    if (doctorProfile) {
      if (fullName) doctorProfile.fullName = fullName;
      if (email) doctorProfile.email = email;
      if (phone) doctorProfile.phone = phone;

      if (doctorProfile.status !== requestedDoctorStatus) {
        doctorProfile.status = requestedDoctorStatus;
        profileStatusChanged = true;
      }

      await doctorProfile.save();
      profileSynced = true;
    }

    const updated = await userModel.findById(user._id).select("-password");
    return res.status(200).json({
      success: true,
      message: profileSynced
        ? "User updated and doctor profile synced"
        : "User updated",
      data: updated,
      profileSynced,
      profileStatusChanged,
      role: updated.role,
      doctorStatus: updated.doctorStatus,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update user" });
  }
};

/** DELETE /api/admin/users/:id - delete (cascades doctor + appointments) */
const deleteUserController = async (req, res) => {
  try {
    const { id } = req.params;

    if (String(id) === String(req.user._id)) {
      return res
        .status(400)
        .json({ success: false, message: "You cannot delete your own account" });
    }

    const user = await userModel.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const doctor = await docModel.findOne({ userId: id });
    if (doctor) {
      await appointmentModel.deleteMany({ doctorId: doctor._id });
      await docModel.deleteOne({ _id: doctor._id });
    }
    await appointmentModel.deleteMany({ userId: id });
    await userModel.deleteOne({ _id: id });

    return res.status(200).json({ success: true, message: "User deleted" });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete user" });
  }
};

/* ------------------------------------------------------------------ *
 * Doctors
 * ------------------------------------------------------------------ */

/** GET /api/admin/getalldoctors - read */
const getAllDoctorsControllers = async (req, res) => {
  try {
    const doctors = await docModel.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: doctors });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch doctors" });
  }
};

/** GET /api/admin/doctors/:id - read one */
const getDoctorController = async (req, res) => {
  try {
    const doctor = await docModel.findById(req.params.id);
    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }
    return res.status(200).json({ success: true, data: doctor });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch doctor" });
  }
};

/** PUT /api/admin/doctors/:id - update (write-through to the linked account) */
const updateDoctorController = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      address,
      specialization,
      experience,
      fees,
      timings,
    } = req.body;

    const doctor = await docModel.findById(req.params.id);
    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }

    // The account holds the login email, so it must stay unique too.
    if (email && doctor.userId) {
      const clash = await userModel.findOne({
        email,
        _id: { $ne: doctor.userId },
      });
      if (clash) {
        return res.status(400).json({
          success: false,
          message: "Another account already uses that email",
        });
      }
    }

    if (fullName) doctor.fullName = fullName;
    if (email) doctor.email = email;
    if (phone) doctor.phone = phone;
    if (address) doctor.address = address;
    if (specialization) doctor.specialization = specialization;
    if (experience) doctor.experience = experience;
    if (fees !== undefined && fees !== "") doctor.fees = Number(fees);
    if (Array.isArray(timings)) doctor.timings = timings;

    await doctor.save();

    // Write-through: keep the linked user account in sync so the doctor can
    // still sign in with the details shown in the admin table.
    let accountSynced = false;
    if (doctor.userId) {
      const account = await userModel.findById(doctor.userId);
      if (account) {
        if (fullName) account.fullName = fullName;
        if (email) account.email = email;
        if (phone) account.phone = phone;
        await account.save();
        accountSynced = true;
      }
    }

    return res.status(200).json({
      success: true,
      message: accountSynced
        ? "Doctor updated and account synced"
        : "Doctor updated",
      data: doctor,
      accountSynced,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update doctor" });
  }
};

/** DELETE /api/admin/doctors/:id - delete (demotes the linked account) */
const deleteDoctorController = async (req, res) => {
  try {
    const doctor = await docModel.findById(req.params.id);
    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }

    await appointmentModel.deleteMany({ doctorId: doctor._id });
    await docModel.deleteOne({ _id: doctor._id });

    if (doctor.userId) {
      const owner = await userModel.findById(doctor.userId);
      if (owner && owner.role === "doctor") {
        owner.role = "patient";
        owner.doctorStatus = "rejected";
        owner.notification.push({
          type: "doctor-status",
          message: "Your doctor profile was removed by an administrator.",
          data: {},
          onClickPath: "/userhome",
        });
        await owner.save();
      }
    }

    return res.status(200).json({ success: true, message: "Doctor deleted" });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete doctor" });
  }
};

/**
 * Grants or revokes the "doctor" role for a doctor application.
 * Approving promotes the account to the doctor role and unblocks the
 * doctor dashboard; rejecting returns the account to patient role.
 */
const setDoctorStatusController = async (req, res, defaultStatus) => {
  try {
    const { doctorId } = req.body;
    const newStatus = defaultStatus;

    const doctor = await docModel.findByIdAndUpdate(
      doctorId,
      { status: newStatus },
      { returnDocument: "after" }
    );
    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }

    const applicant = await userModel.findById(doctor.userId);
    if (applicant) {
      applicant.role = newStatus === "approved" ? "doctor" : "patient";
      applicant.doctorStatus = newStatus;
      applicant.notification.push({
        type: "doctor-status",
        message:
          newStatus === "approved"
            ? "Your doctor account has been verified. You can now access the doctor dashboard."
            : "Your doctor application was rejected. You may apply again.",
        data: { doctorId, status: newStatus },
        onClickPath: applicant.role === "doctor" ? "/doctorhome" : "/userhome",
      });
      await applicant.save();
    }

    return res.status(200).json({
      success: true,
      message: `Doctor ${newStatus}`,
      data: doctor,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update doctor status" });
  }
};

const getStatusApproveController = (req, res) =>
  setDoctorStatusController(req, res, "approved");

const getStatusRejectController = (req, res) =>
  setDoctorStatusController(req, res, "rejected");

/* ------------------------------------------------------------------ *
 * Appointments
 * ------------------------------------------------------------------ */

/** GET /api/admin/getallAppointmentsAdmin - read */
const displayAllAppointmentController = async (req, res) => {
  try {
    const appointments = await appointmentModel.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: appointments });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch appointments" });
  }
};

/** GET /api/admin/appointments/:id - read one */
const getAppointmentController = async (req, res) => {
  try {
    const appointment = await appointmentModel.findById(req.params.id);
    if (!appointment) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }
    return res.status(200).json({ success: true, data: appointment });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch appointment" });
  }
};

/** PUT /api/admin/appointments/:id - update status */
const updateAppointmentController = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res
        .status(400)
        .json({ success: false, message: "status is required" });
    }

    const appointment = await appointmentModel.findById(req.params.id);
    if (!appointment) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    appointment.status = status;
    await appointment.save();

    await userModel.updateOne(
      { _id: appointment.userId },
      {
        $push: {
          notification: {
            type: "appointment-status",
            message: `Your appointment was updated to "${status}" by an administrator.`,
            data: { appointmentId: appointment._id, status },
            onClickPath: "/userhome",
          },
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Appointment updated",
      data: appointment,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update appointment" });
  }
};

/** DELETE /api/admin/appointments/:id - delete */
const deleteAppointmentController = async (req, res) => {
  try {
    const appointment = await appointmentModel.findByIdAndDelete(req.params.id);
    if (!appointment) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }
    return res
      .status(200)
      .json({ success: true, message: "Appointment deleted" });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete appointment" });
  }
};

module.exports = {
  // users
  getAllUsersControllers,
  getUserController,
  createUserController,
  updateUserController,
  deleteUserController,
  // doctors
  getAllDoctorsControllers,
  getDoctorController,
  updateDoctorController,
  deleteDoctorController,
  getStatusApproveController,
  getStatusRejectController,
  // appointments
  displayAllAppointmentController,
  getAppointmentController,
  updateAppointmentController,
  deleteAppointmentController,
};

module.exports.APPROVAL_STATUSES = APPROVAL_STATUSES;
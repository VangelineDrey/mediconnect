const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("../schemas/userModel");
const docModel = require("../schemas/docModel");
const appointmentModel = require("../schemas/appointmentModel");
const fs = require("fs");
const path = require("path");

const registerController = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;
    const existing = await userModel.findOne({ email });
    if (existing) {
      return res
        .status(200)
        .json({ success: false, message: "User already exists" });
    }
    const hashed = await bcrypt.hash(password, 10);
    const newUser = new userModel({
      fullName,
      email,
      password: hashed,
      phone,
      role: "patient",
      doctorStatus: "none",
    });
    await newUser.save();
    return res
      .status(201)
      .json({ success: true, message: "Registration successful" });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Registration failed" });
  }
};

const registerDoctorController = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      phone,
      address,
      specialization,
      experience,
      fees,
      timings,
    } = req.body;

    const existing = await userModel.findOne({ email });
    if (existing) {
      return res
        .status(200)
        .json({ success: false, message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const newUser = new userModel({
      fullName,
      email,
      password: hashed,
      phone,
      role: "patient",
      doctorStatus: "pending",
    });
    await newUser.save();

    const newDoctor = new docModel({
      userId: newUser._id,
      fullName,
      email,
      phone,
      address,
      specialization,
      experience,
      fees,
      timings: Array.isArray(timings) ? timings : [timings],
      status: "pending",
    });
    await newDoctor.save();

    const admins = await userModel.find({ role: "admin" });
    for (const admin of admins) {
      admin.notification.push({
        type: "doctor-application",
        message: `${fullName} registered as a doctor`,
        data: { doctorId: newDoctor._id, userId: newUser._id },
        onClickPath: "/adminhome",
      });
      await admin.save();
    }

    return res.status(201).json({
      success: true,
      message: "Registration submitted for admin verification",
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Registration failed" });
  }
};

const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_KEY, {
      expiresIn: "7d",
    });
    const userObj = user.toObject();
    delete userObj.password;
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      data: userObj,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Login failed" });
  }
};

const authController = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId;
    const user = await userModel.findById(userId).select("-password");
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

const docController = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      email,
      address,
      specialization,
      experience,
      fees,
      timings,
    } = req.body;
    const userId = req.userId || req.body.userId;
    const applicant = await userModel.findById(userId);
    if (!applicant) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (applicant.role === "doctor") {
      return res
        .status(400)
        .json({ success: false, message: "You are already a doctor" });
    }

    if (applicant.doctorStatus === "pending") {
      return res.status(400).json({
        success: false,
        message: "You already have an application awaiting verification",
      });
    }

    const newDoctor = new docModel({
      userId,
      fullName,
      phone,
      email,
      address,
      specialization,
      experience,
      fees,
      timings: Array.isArray(timings) ? timings : [timings],
      status: "pending",
    });
    await newDoctor.save();

    applicant.doctorStatus = "pending";
    applicant.notification.push({
      type: "doctor-application",
      message: "Your doctor application is awaiting admin verification",
      data: { doctorId: newDoctor._id },
      onClickPath: "/userhome",
    });
    await applicant.save();

    const admins = await userModel.find({ role: "admin" });
    for (const admin of admins) {
      admin.notification.push({
        type: "doctor-application",
        message: `${fullName} applied for a doctor account`,
        data: { doctorId: newDoctor._id, userId },
        onClickPath: "/adminhome",
      });
      await admin.save();
    }

    return res
      .status(201)
      .json({ success: true, message: "Doctor application submitted" });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to apply as doctor" });
  }
};

const getallnotificationController = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId;
    const user = await userModel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    user.seennotification.push(...(user.notification || []));
    user.notification = [];
    await user.save();
    const updated = await userModel.findById(userId).select("-password");
    return res.status(200).json({
      success: true,
      message: "Notifications marked as read",
      data: updated,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update notifications" });
  }
};

const deleteallnotificationController = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId;
    const user = await userModel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    user.notification = [];
    user.seennotification = [];
    await user.save();
    const updated = await userModel.findById(userId).select("-password");
    return res.status(200).json({
      success: true,
      message: "Notifications cleared",
      data: updated,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to clear notifications" });
  }
};

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Turns any supported input into a canonical "YYYY-MM-DD HH:mm" string. */
const normaliseSlot = (value) => {
  if (!value) return null;
  const match = String(value)
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (!match) return null;
  const [, y, m, d, hh, mm] = match;
  return `${y}-${m}-${d} ${hh}:${mm}`;
};

const toMinutes = (hhmm) => {
  const match = String(hhmm).match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
};

/**
 * Validates the requested slot against the doctor's `timings` window.
 * Returns an error message, or null when it is fine / not checkable.
 */
const outsideDoctorHours = (slot, timings) => {
  if (!Array.isArray(timings) || timings.length < 2) return null;

  const start = toMinutes(timings[0]);
  const end = toMinutes(timings[timings.length - 1]);
  if (start === null || end === null || end <= start) return null;

  const requested = toMinutes(slot.slice(11, 16));
  if (requested === null) return null;

  if (requested < start || requested > end) {
    const fmt = (m) =>
      `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
    return `This doctor is available between ${fmt(start)} and ${fmt(end)}.`;
  }
  return null;
};

/**
 * GET /api/user/getalldoctorsu
 * Lists approved doctors with optional search / filter / sort.
 * Query: ?search=&specialization=&maxFee=&sort=fee_asc|fee_desc|name
 */
const getAllDoctorsControllers = async (req, res) => {
  try {
    const { search, specialization, maxFee, sort } = req.query;

    const filter = { status: "approved" };

    if (specialization && specialization !== "all") {
      filter.specialization = specialization;
    }

    if (maxFee && !Number.isNaN(Number(maxFee))) {
      filter.fees = { $lte: Number(maxFee) };
    }

    if (search && search.trim()) {
      const rx = new RegExp(escapeRegex(search.trim()), "i");
      filter.$or = [{ fullName: rx }, { specialization: rx }, { address: rx }];
    }

    let query = docModel.find(filter);
    if (sort === "fee_asc") query = query.sort({ fees: 1 });
    else if (sort === "fee_desc") query = query.sort({ fees: -1 });
    else query = query.sort({ fullName: 1 });

    const doctors = await query;

    // Feed the filter dropdown, always from the full approved set.
    const specializations = await docModel.distinct("specialization", {
      status: "approved",
    });

    return res.status(200).json({
      success: true,
      data: doctors,
      specializations: specializations.filter(Boolean).sort(),
      total: doctors.length,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch doctors" });
  }
};

const appointmentController = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId;
    let userInfo = req.body.userInfo;
    let doctorInfo = req.body.doctorInfo;
    try {
      if (typeof userInfo === "string") userInfo = JSON.parse(userInfo);
    } catch (e) {}
    try {
      if (typeof doctorInfo === "string") doctorInfo = JSON.parse(doctorInfo);
    } catch (e) {}

    const date = req.body.date || req.body.dateTime || req.body.appointmentDate;

    if (!doctorInfo || !userInfo) {
      return res
        .status(400)
        .json({ success: false, message: "Missing appointment data" });
    }

    if (!date) {
      return res
        .status(400)
        .json({ success: false, message: "Please choose a date and time" });
    }

    // Normalise to "YYYY-MM-DD HH:mm" so slot comparisons are reliable.
    const slot = normaliseSlot(date);
    if (!slot) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid appointment date" });
    }

    if (new Date(slot.replace(" ", "T")) < new Date()) {
      return res
        .status(400)
        .json({ success: false, message: "Cannot book a time in the past" });
    }

    const doctor = await docModel.findById(doctorInfo._id);
    if (!doctor || doctor.status !== "approved") {
      return res
        .status(400)
        .json({ success: false, message: "This doctor is not available" });
    }

    // Only one live booking per doctor per slot.
    const conflict = await appointmentModel.findOne({
      doctorId: doctor._id,
      date: slot,
      status: { $in: ["pending", "approved"] },
    });
    if (conflict) {
      return res.status(409).json({
        success: false,
        message: "That time slot is already booked. Please pick another time.",
      });
    }

    // Respect the doctor's published consultation hours.
    const hoursError = outsideDoctorHours(slot, doctor.timings);
    if (hoursError) {
      return res.status(400).json({ success: false, message: hoursError });
    }

    const document = req.file
      ? {
          path: req.file.path.replace(/\\/g, "/"),
          filename: req.file.originalname,
          mimetype: req.file.mimetype,
        }
      : undefined;

    const newAppointment = new appointmentModel({
      userId: userInfo._id || userId,
      doctorId: doctor._id,
      userInfo,
      doctorInfo,
      date: slot,
      document,
      status: "pending",
    });
    await newAppointment.save();

    if (doctor && doctor.userId) {
      const doctorUser = await userModel.findById(doctor.userId);
      if (doctorUser) {
        doctorUser.notification.push({
          type: "appointment-request",
          message: `New appointment request from ${userInfo.fullName || "a user"}`,
          data: { appointmentId: newAppointment._id },
          onClickPath: "/doctorhome",
        });
        await doctorUser.save();
      }
    }

    return res
      .status(201)
      .json({ success: true, message: "Appointment booked successfully" });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to book appointment" });
  }
};

const getAllUserAppointments = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId;
    const appointments = await appointmentModel.find({ userId });
    const doctorIds = appointments.map((a) => a.doctorId);
    const doctors = await docModel.find({ _id: { $in: doctorIds } });
    const withNames = appointments.map((a) => {
      const obj = a.toObject();
      const doc = doctors.find((d) => String(d._id) === String(a.doctorId));
      obj.docName = doc ? doc.fullName : a.doctorInfo?.fullName;
      return obj;
    });
    return res.status(200).json({ success: true, data: withNames });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch appointments" });
  }
};

/**
 * PUT /api/user/appointments/:id/cancel
 * A patient may cancel their own pending or approved appointment.
 */
const cancelAppointmentController = async (req, res) => {
  try {
    const appointment = await appointmentModel.findById(req.params.id);

    if (!appointment) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    // Ownership check - a patient can only cancel their own booking.
    if (String(appointment.userId) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You can only cancel your own appointments",
      });
    }

    if (["completed", "cancelled", "rejected"].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: `An appointment that is ${appointment.status} cannot be cancelled`,
      });
    }

    appointment.status = "cancelled";
    await appointment.save();

    // Let the doctor know the slot was freed.
    const doctor = await docModel.findById(appointment.doctorId);
    if (doctor && doctor.userId) {
      const doctorUser = await userModel.findById(doctor.userId);
      if (doctorUser) {
        doctorUser.notification.push({
          type: "appointment-cancelled",
          message: `${appointment.userInfo?.fullName || "A patient"} cancelled the appointment on ${appointment.date}`,
          data: { appointmentId: appointment._id },
          onClickPath: "/doctorhome",
        });
        await doctorUser.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Appointment cancelled",
      data: appointment,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to cancel appointment" });
  }
};

const getDocsController = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId;
    const user = await userModel.findById(userId).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    return res.status(200).json({ success: true, data: user.documents || [] });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch documents" });
  }
};

module.exports = {
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
};
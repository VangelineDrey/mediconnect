const mongoose = require("mongoose");

const userModel = mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "full name is required"],
      set: (value) => value.charAt(0).toUpperCase() + value.slice(1),
    },
    email: {
      type: String,
      required: [true, "email is required"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "password is required"],
    },
    phone: {
      type: String,
      required: [true, "phone is required"],
    },
    /**
     * The account role. "doctor" is a real, separate role - a doctor's
     * professional data lives in the doctors collection and is only reachable
     * once an admin approves the application.
     */
    role: {
      type: String,
      enum: ["patient", "doctor", "admin"],
      default: "patient",
    },
    /** Status of this account's doctor application. */
    doctorStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },
    notification: {
      type: Array,
      default: [],
    },
    seennotification: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true }
);

const userSchema = mongoose.model("user", userModel);

module.exports = userSchema;
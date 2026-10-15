const userModel = require("../schemas/userModel");
const docModel = require("../schemas/docModel");

/**
 * Repairs any account whose role / doctorStatus / doctors.status drifted apart.
 *
 * Invariant restored:
 *   role === "doctor"  <=>  doctorStatus === "approved"
 *                         <=>  doctors.status === "approved"
 *
 * Safe to re-run; it only touches rows that violate the invariant.
 */
const repairDoctorStatus = async () => {
  try {
    const users = await userModel.find().select("+type +isdoctor");
    let fixed = 0;

    for (const user of users) {
      const profile = await docModel.findOne({ userId: user._id });
      const isAdmin = user.role === "admin";

      // Admins never carry a doctor application state.
      if (isAdmin) {
        if (user.doctorStatus !== "none") {
          user.doctorStatus = "none";
          await user.save();
          fixed++;
        }
        continue;
      }

      let role = user.role;
      let doctorStatus = user.doctorStatus;

      if (!profile) {
        // No profile => cannot be a doctor.
        if (role === "doctor") {
          role = "patient";
          doctorStatus = "rejected";
        }
        if (doctorStatus === "approved") doctorStatus = "rejected";
      } else {
        // Derive everything from the profile, which is the authoritative record.
        const profileStatus = ["approved", "rejected", "pending"].includes(
          profile.status
        )
          ? profile.status
          : "pending";

        doctorStatus = profileStatus;
        role = profileStatus === "approved" ? "doctor" : "patient";
      }

      const profileNeedsUpdate =
        profile &&
        profile.status !== doctorStatus &&
        ["approved", "rejected", "pending"].includes(doctorStatus);

      if (role !== user.role || doctorStatus !== user.doctorStatus || profileNeedsUpdate) {
        user.role = role;
        user.doctorStatus = doctorStatus;
        await user.save();
        if (profileNeedsUpdate) {
          profile.status = doctorStatus;
          await profile.save();
        }
        fixed++;
        console.log(
          `  repaired ${user.email}: role=${role}, doctorStatus=${doctorStatus}` +
            (profile ? `, profile=${doctorStatus}` : ", profile=none")
        );
      }
    }

    if (fixed > 0) {
      console.log(`Repaired ${fixed} account(s) with inconsistent doctor status.`);
    } else {
      console.log("Doctor status data is consistent.");
    }
  } catch (err) {
    console.error("Doctor status repair failed:", err.message);
  }
};

module.exports = repairDoctorStatus;
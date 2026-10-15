const userModel = require("../schemas/userModel");
const docModel = require("../schemas/docModel");

/**
 * One-time, idempotent migration from the legacy schema
 * (`type: user|doctor|admin` + `isdoctor: boolean`)
 * to the role based schema (`role: patient|doctor|admin` + `doctorStatus`).
 *
 * Safe to run on every boot: users that already have both `role` and
 * `doctorStatus` are skipped.
 */
const migrateRoles = async () => {
  try {
    const legacyUsers = await userModel
      .find({ role: { $exists: false } })
      .select("+type +isdoctor");

    if (legacyUsers.length === 0) return;

    for (const user of legacyUsers) {
      const raw = user.toObject();
      const oldType = raw.type;
      const oldIsDoctor = raw.isdoctor === true;

      let role = "patient";
      if (oldType === "admin") role = "admin";
      else if (oldType === "doctor" || oldIsDoctor) role = "doctor";

      let doctorStatus = "none";
      if (role === "doctor") {
        doctorStatus = "approved";
      } else {
        const doctorRecord = await docModel
          .findOne({ userId: user._id })
          .sort({ createdAt: -1 });
        if (doctorRecord) {
          doctorStatus = ["approved", "rejected", "pending"].includes(
            doctorRecord.status
          )
            ? doctorRecord.status
            : "pending";
        }
      }

      await userModel.updateOne(
        { _id: user._id },
        {
          $set: { role, doctorStatus },
          $unset: { type: "", isdoctor: "" },
        }
      );
    }

    console.log(
      `Migrated ${legacyUsers.length} account(s) to the new role model.`
    );
  } catch (err) {
    console.error("Role migration failed:", err.message);
  }
};

module.exports = migrateRoles;
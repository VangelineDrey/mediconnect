const jwt = require("jsonwebtoken");
const userModel = require("../schemas/userModel");

/**
 * Verifies the JWT and loads the current user record.
 * The DB is the single source of truth for the role, so a role change
 * (e.g. admin approving a doctor) takes effect immediately.
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_KEY);

    const user = await userModel.findById(decoded.id).select("-password");
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User no longer exists" });
    }

    req.user = user;
    req.userId = String(user._id);
    req.body = req.body || {};
    req.body.userId = String(user._id);
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
};

/**
 * Role based access control. Must be used after authMiddleware.
 * Example: router.get("/getallusers", authMiddleware, requireRole("admin"), handler)
 */
const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires role: ${roles.join(" or ")}`,
      });
    }
    next();
  };

module.exports = { authMiddleware, requireRole };
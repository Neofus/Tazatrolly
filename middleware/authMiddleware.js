const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      // Extract token
      token = req.headers.authorization.split(" ")[1];
      // Decode token and find user
      const decoded = jwt.verify(token, process.env.SECRET_CODE);

      req.user = await User.findById(decoded.userId).select("-password");

      if (!req.user) {
        return res.status(404).json({ success: false, message: "User not found." });
      }

      next();
    } catch (error) {
      console.error("Authorization error:", error.message);
      return res.status(401).json({ success: false, message: "Not authorized, token failed." });
    }
  } else {
    return res.status(401).json({ success: false, message: "Not authorized, no token." });
  }
};
exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    return res.status(403).json({ success: false, message: "Admin access only." });
  }
};

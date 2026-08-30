const jwt = require("jsonwebtoken");
const { JWT_ADMIN_PASSWORD } = require("../config");

function adminMiddleware(req, res, next) {
  try {
    let token = req.headers.token;
    
    // Support Bearer authorization header as well
    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(" ");
      if (parts.length === 2 && parts[0] === "Bearer") {
        token = parts[1];
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Admin authorization token required."
      });
    }

    const decoded = jwt.verify(token, JWT_ADMIN_PASSWORD);

    if (decoded && (decoded.id || decoded.adminId)) {
      req.adminId = decoded.id || decoded.adminId;
      req.admin = decoded;
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: "Invalid admin privileges."
      });
    }
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Session expired or invalid admin token.",
      error: error.message
    });
  }
}

module.exports = {
  adminMiddleware
};
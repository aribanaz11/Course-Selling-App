const jwt = require("jsonwebtoken");
const { JWT_USER_PASSWORD } = require("../config");

function userMiddleware(req, res, next) {
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
        message: "Access denied. No authentication token provided."
      });
    }

    const decoded = jwt.verify(token, JWT_USER_PASSWORD);

    if (decoded && (decoded.id || decoded.userId)) {
      req.userId = decoded.id || decoded.userId;
      req.user = decoded;
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: "Invalid or expired token. Please sign in again."
      });
    }
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Session expired or invalid token. Please sign in again.",
      error: error.message
    });
  }
}

module.exports = {
  userMiddleware
};
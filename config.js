require("dotenv").config();

const JWT_USER_PASSWORD = process.env.JWT_USER_PASSWORD || "lumina_user_secret_key_2026";
const JWT_ADMIN_PASSWORD = process.env.JWT_ADMIN_PASSWORD || "lumina_admin_secret_key_2026";
const MONGO_URL = process.env.MONGO_URL || process.env.Host || "mongodb://127.0.0.1:27017/course_app";
const PORT = process.env.PORT || 30001;

module.exports = {
  JWT_USER_PASSWORD,
  JWT_ADMIN_PASSWORD,
  MONGO_URL,
  PORT
};

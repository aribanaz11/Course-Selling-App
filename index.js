const express = require("express");
const cors = require("cors");
const path = require("path");
const { connectDB } = require("./db");
const { PORT } = require("./config");
const { userRouter } = require("./routes/user");
const { courseRouter } = require("./routes/course");
const { adminRouter } = require("./routes/admin");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets
app.use(express.static(path.join(__dirname, "public")));

// API Routes
app.use("/api/v1/user", userRouter);
app.use("/api/v1/course", courseRouter);
app.use("/api/v1/admin", adminRouter);

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "Lumina Learn Course Marketplace API"
  });
});

// SPA Fallback: Serve index.html for any unhandled web routes
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ success: false, message: "API endpoint not found." });
  }
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start Server
async function startServer(portOverride) {
  await connectDB();
  
  const serverPort = portOverride || PORT || 30001;
  return new Promise((resolve) => {
    const server = app.listen(serverPort, () => {
      console.log(`\n======================================================`);
      console.log(` 🚀 Lumina Learn Server is actively running!`);
      console.log(` 🌐 Web Application: http://localhost:${serverPort}`);
      console.log(` 📡 User API:        http://localhost:${serverPort}/api/v1/user`);
      console.log(` 📡 Course API:      http://localhost:${serverPort}/api/v1/course`);
      console.log(` 📡 Admin API:       http://localhost:${serverPort}/api/v1/admin`);
      console.log(`======================================================\n`);
      resolve(server);
    });
  });
}

if (require.main === module) {
  startServer().catch(err => {
    console.error("Server startup failure:", err);
  });
}

module.exports = {
  app,
  startServer,
  connectDB
};
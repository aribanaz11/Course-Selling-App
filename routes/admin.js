const { Router } = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { db } = require("../db");
const { JWT_ADMIN_PASSWORD } = require("../config");
const { adminMiddleware } = require("../middleware/admin");

const adminRouter = Router();

// Admin Signup
adminRouter.post("/signup", async function (req, res) {
  try {
    const { email, password, firstName, lastName, title, bio } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: "All fields (email, password, firstName, lastName) are required."
      });
    }

    const existingAdmin = await db.admins.findOne({ email });
    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: "An admin account with this email already exists."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = await db.admins.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      title: title || "Senior Instructor",
      bio: bio || "Passionate educator and industry expert.",
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(firstName + lastName)}`
    });

    const token = jwt.sign(
      { id: newAdmin._id || newAdmin.id, email: newAdmin.email, role: "admin" },
      JWT_ADMIN_PASSWORD,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      success: true,
      message: "Admin account created successfully!",
      token,
      admin: {
        id: newAdmin._id || newAdmin.id,
        email: newAdmin.email,
        firstName: newAdmin.firstName,
        lastName: newAdmin.lastName,
        title: newAdmin.title,
        avatar: newAdmin.avatar,
        role: "admin"
      }
    });
  } catch (error) {
    console.error("Admin Signup Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create admin account.",
      error: error.message
    });
  }
});

// Admin Signin
adminRouter.post("/signin", async function (req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required."
      });
    }

    const admin = await db.admins.findOne({ email });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin email or password."
      });
    }

    let isPasswordValid = false;
    if (admin.password.startsWith("$2a$") || admin.password.startsWith("$2b$")) {
      isPasswordValid = await bcrypt.compare(password, admin.password);
    } else {
      isPasswordValid = admin.password === password;
    }

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin email or password."
      });
    }

    const token = jwt.sign(
      { id: admin._id || admin.id, email: admin.email, role: "admin" },
      JWT_ADMIN_PASSWORD,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      message: `Welcome to Creator Studio, ${admin.firstName}!`,
      token,
      admin: {
        id: admin._id || admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        title: admin.title,
        avatar: admin.avatar,
        role: "admin"
      }
    });
  } catch (error) {
    console.error("Admin Signin Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during admin sign in.",
      error: error.message
    });
  }
});

// Get Admin Profile
adminRouter.get("/profile", adminMiddleware, async function (req, res) {
  try {
    const admin = await db.admins.findById(req.adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin profile not found."
      });
    }

    const courses = await db.courses.find({});
    return res.json({
      success: true,
      admin: {
        id: admin._id || admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        title: admin.title,
        bio: admin.bio,
        avatar: admin.avatar,
        totalCourses: courses.length
      }
    });
  } catch (error) {
    console.error("Admin Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin profile.",
      error: error.message
    });
  }
});

// Create New Course
adminRouter.post("/course", adminMiddleware, async function (req, res) {
  try {
    const admin = await db.admins.findById(req.adminId);
    const {
      title,
      subtitle,
      description,
      price,
      originalPrice,
      imageUrl,
      category,
      level,
      duration,
      highlights,
      curriculum,
      tags
    } = req.body;

    if (!title || !description || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Title, description, and price are required to create a course."
      });
    }

    const formattedCurriculum = Array.isArray(curriculum) && curriculum.length > 0
      ? curriculum
      : [
          {
            title: "Module 1: Introduction & Environment Setup",
            lessons: [
              {
                title: "Welcome & Course Overview",
                duration: "10 min",
                isPreview: true,
                videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                summary: "Introduction to the course goals and workflow."
              }
            ]
          }
        ];

    let calculatedLessonsCount = 0;
    formattedCurriculum.forEach(sec => {
      if (sec.lessons) calculatedLessonsCount += sec.lessons.length;
    });

    const newCourse = await db.courses.create({
      title,
      subtitle: subtitle || "",
      description,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : Math.round(Number(price) * 1.6),
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80",
      category: category || "Web Development",
      level: level || "All Levels",
      duration: duration || "20 Hours",
      lessonsCount: calculatedLessonsCount || 15,
      instructorId: req.adminId,
      instructorName: admin ? `${admin.firstName} ${admin.lastName}` : "Lead Instructor",
      instructorAvatar: admin ? admin.avatar : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      highlights: Array.isArray(highlights) ? highlights : (highlights ? [highlights] : []),
      curriculum: formattedCurriculum,
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(",").map(t => t.trim()) : ["Tech"]),
      featured: true,
      bestseller: false
    });

    return res.status(201).json({
      success: true,
      message: "Course created and published successfully!",
      courseId: newCourse._id || newCourse.id,
      course: newCourse
    });
  } catch (error) {
    console.error("Create Course Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create course.",
      error: error.message
    });
  }
});

// Update Existing Course
adminRouter.put("/course/:id", adminMiddleware, async function (req, res) {
  try {
    const { id } = req.params;
    const course = await db.courses.findById(id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found."
      });
    }

    const updateData = { ...req.body };
    if (updateData.price) updateData.price = Number(updateData.price);
    if (updateData.originalPrice) updateData.originalPrice = Number(updateData.originalPrice);

    if (updateData.curriculum && Array.isArray(updateData.curriculum)) {
      let count = 0;
      updateData.curriculum.forEach(sec => {
        if (sec.lessons) count += sec.lessons.length;
      });
      updateData.lessonsCount = count;
    }

    const updatedCourse = await db.courses.findByIdAndUpdate(id, updateData);

    return res.json({
      success: true,
      message: "Course updated successfully.",
      course: updatedCourse
    });
  } catch (error) {
    console.error("Update Course Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update course.",
      error: error.message
    });
  }
});

// Delete a Course
adminRouter.delete("/course/:id", adminMiddleware, async function (req, res) {
  try {
    const { id } = req.params;
    const deletedCourse = await db.courses.findByIdAndDelete(id);

    if (!deletedCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found."
      });
    }

    return res.json({
      success: true,
      message: "Course deleted successfully.",
      deletedCourseId: id
    });
  } catch (error) {
    console.error("Delete Course Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete course.",
      error: error.message
    });
  }
});

// Get Bulk / My Courses
adminRouter.get("/course/bulk", adminMiddleware, async function (req, res) {
  try {
    const courses = await db.courses.find({});
    return res.json({
      success: true,
      count: courses.length,
      courses
    });
  } catch (error) {
    console.error("Fetch Bulk Courses Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch courses.",
      error: error.message
    });
  }
});

// Admin Analytics
adminRouter.get("/analytics", adminMiddleware, async function (req, res) {
  try {
    const courses = await db.courses.find({});
    const purchases = await db.purchases.find({});

    const totalRevenue = purchases.reduce((sum, p) => sum + (p.pricePaid || 0), 0);
    const totalStudents = new Set(purchases.map(p => String(p.userId))).size;
    const totalSales = purchases.length;

    // Course performance breakdown
    const courseStats = courses.map(course => {
      const coursePurchases = purchases.filter(p => String(p.courseId) === String(course._id || course.id));
      const revenue = coursePurchases.reduce((sum, p) => sum + (p.pricePaid || 0), 0);
      return {
        id: course._id || course.id,
        title: course.title,
        category: course.category,
        price: course.price,
        rating: course.rating,
        enrolledCount: course.enrolledCount || coursePurchases.length,
        salesCount: coursePurchases.length,
        revenue
      };
    });

    return res.json({
      success: true,
      analytics: {
        totalRevenue: Math.max(totalRevenue, 24850), // fallback baseline for dashboard showcase
        totalStudents: Math.max(totalStudents, 1250),
        totalSales: Math.max(totalSales, 380),
        totalCourses: courses.length,
        averageRating: 4.9,
        courseStats
      }
    });
  } catch (error) {
    console.error("Admin Analytics Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to calculate analytics.",
      error: error.message
    });
  }
});

module.exports = {
  adminRouter
};
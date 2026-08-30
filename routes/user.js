const { Router } = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { db } = require("../db");
const { JWT_USER_PASSWORD } = require("../config");
const { userMiddleware } = require("../middleware/user");

const userRouter = Router();

// User Signup
userRouter.post("/signup", async function (req, res) {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: "All fields (email, password, firstName, lastName) are required."
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long."
      });
    }

    const existingUser = await db.users.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists. Please sign in."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await db.users.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(firstName + lastName)}`,
      role: "user"
    });

    const token = jwt.sign(
      { id: newUser._id || newUser.id, email: newUser.email, role: "user" },
      JWT_USER_PASSWORD,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      success: true,
      message: "Account created successfully! Welcome to Lumina.",
      token,
      user: {
        id: newUser._id || newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        avatar: newUser.avatar,
        role: "user"
      }
    });
  } catch (error) {
    console.error("User Signup Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during registration.",
      error: error.message
    });
  }
});

// User Signin
userRouter.post("/signin", async function (req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required."
      });
    }

    const user = await db.users.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    // Support both hashed password and plain-text fallback
    let isPasswordValid = false;
    if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$")) {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } else {
      isPasswordValid = user.password === password;
    }

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    const token = jwt.sign(
      { id: user._id || user.id, email: user.email, role: "user" },
      JWT_USER_PASSWORD,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      message: `Welcome back, ${user.firstName}!`,
      token,
      user: {
        id: user._id || user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        role: "user"
      }
    });
  } catch (error) {
    console.error("User Signin Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during sign in.",
      error: error.message
    });
  }
});

// Get User Profile
userRouter.get("/profile", userMiddleware, async function (req, res) {
  try {
    const user = await db.users.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User profile not found."
      });
    }

    const purchases = await db.purchases.find({ userId: req.userId });

    return res.json({
      success: true,
      user: {
        id: user._id || user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        role: "user",
        enrolledCoursesCount: purchases.length,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error("Get Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user profile.",
      error: error.message
    });
  }
});

// Update User Profile
userRouter.put("/profile", userMiddleware, async function (req, res) {
  try {
    const { firstName, lastName, avatar } = req.body;
    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (avatar) updateData.avatar = avatar;

    const updatedUser = await db.users.updateById(req.userId, updateData);

    return res.json({
      success: true,
      message: "Profile updated successfully.",
      user: {
        id: updatedUser._id || updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        avatar: updatedUser.avatar,
        role: "user"
      }
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update profile.",
      error: error.message
    });
  }
});

// Get User's Purchased Courses
userRouter.get("/purchases", userMiddleware, async function (req, res) {
  try {
    const purchases = await db.purchases.find({ userId: req.userId });
    
    // Resolve course details for each purchase
    const enrichedPurchases = await Promise.all(
      purchases.map(async (purchase) => {
        let course = null;
        if (purchase.courseId && typeof purchase.courseId === "object" && purchase.courseId.title) {
          course = purchase.courseId;
        } else {
          course = await db.courses.findById(purchase.courseId);
        }

        return {
          purchaseId: purchase._id || purchase.id,
          purchasedAt: purchase.purchasedAt,
          pricePaid: purchase.pricePaid,
          progressPercentage: purchase.progressPercentage || 0,
          completedLessons: purchase.completedLessons || [],
          course: course || {
            _id: purchase.courseId,
            title: "Course Content",
            description: "Course purchased",
            imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80",
            category: "General",
            curriculum: []
          }
        };
      })
    );

    return res.json({
      success: true,
      count: enrichedPurchases.length,
      purchases: enrichedPurchases
    });
  } catch (error) {
    console.error("Fetch Purchases Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch purchased courses.",
      error: error.message
    });
  }
});

// Update Lesson Progress
userRouter.post("/progress", userMiddleware, async function (req, res) {
  try {
    const { courseId, lessonId } = req.body;
    if (!courseId || !lessonId) {
      return res.status(400).json({
        success: false,
        message: "courseId and lessonId are required."
      });
    }

    const updated = await db.purchases.updateProgress(req.userId, courseId, lessonId);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Purchase record not found for this course."
      });
    }

    return res.json({
      success: true,
      message: "Progress updated successfully.",
      progressPercentage: updated.progressPercentage,
      completedLessons: updated.completedLessons
    });
  } catch (error) {
    console.error("Update Progress Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update learning progress.",
      error: error.message
    });
  }
});

module.exports = {
  userRouter
};
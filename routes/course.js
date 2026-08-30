const { Router } = require("express");
const { db } = require("../db");
const { userMiddleware } = require("../middleware/user");

const courseRouter = Router();

// Get list of categories with course count
courseRouter.get("/categories", async function (req, res) {
  try {
    const courses = await db.courses.find({});
    const categoriesMap = {};

    courses.forEach(c => {
      const cat = c.category || "General";
      categoriesMap[cat] = (categoriesMap[cat] || 0) + 1;
    });

    const categories = Object.keys(categoriesMap).map(name => ({
      name,
      count: categoriesMap[name]
    }));

    return res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error("Get Categories Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories.",
      error: error.message
    });
  }
});

// Browse / Preview All Courses with Search, Category Filter, Sorting
courseRouter.get("/preview", async function (req, res) {
  return handleFetchCourses(req, res);
});

courseRouter.get("/all", async function (req, res) {
  return handleFetchCourses(req, res);
});

courseRouter.get("/", async function (req, res) {
  return handleFetchCourses(req, res);
});

async function handleFetchCourses(req, res) {
  try {
    const { category, search, level, sort } = req.query;
    let courses = await db.courses.find({});

    // Filter by Category
    if (category && category !== "All") {
      courses = courses.filter(c => c.category && c.category.toLowerCase() === category.toLowerCase());
    }

    // Filter by Level
    if (level && level !== "All") {
      courses = courses.filter(c => c.level && c.level.toLowerCase().includes(level.toLowerCase()));
    }

    // Search Query
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      courses = courses.filter(c => {
        const inTitle = c.title && c.title.toLowerCase().includes(q);
        const inDesc = c.description && c.description.toLowerCase().includes(q);
        const inSub = c.subtitle && c.subtitle.toLowerCase().includes(q);
        const inInst = c.instructorName && c.instructorName.toLowerCase().includes(q);
        const inTags = Array.isArray(c.tags) && c.tags.some(t => t.toLowerCase().includes(q));
        return inTitle || inDesc || inSub || inInst || inTags;
      });
    }

    // Sorting
    if (sort === "price-low") {
      courses.sort((a, b) => a.price - b.price);
    } else if (sort === "price-high") {
      courses.sort((a, b) => b.price - a.price);
    } else if (sort === "rating") {
      courses.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sort === "popular") {
      courses.sort((a, b) => (b.enrolledCount || 0) - (a.enrolledCount || 0));
    } else {
      // Default: Newest first or featured
      courses.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || new Date(b.createdAt) - new Date(a.createdAt));
    }

    return res.json({
      success: true,
      count: courses.length,
      courses
    });
  } catch (error) {
    console.error("Fetch Courses Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch courses.",
      error: error.message
    });
  }
}

// Get Single Course Details by ID
courseRouter.get("/:id", async function (req, res) {
  try {
    const { id } = req.params;
    const course = await db.courses.findById(id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found."
      });
    }

    // Fetch reviews for this course
    const reviews = await db.reviews.find({ courseId: id });

    return res.json({
      success: true,
      course,
      reviews
    });
  } catch (error) {
    console.error("Fetch Single Course Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve course details.",
      error: error.message
    });
  }
});

// Purchase a Course
courseRouter.post("/purchase", userMiddleware, async function (req, res) {
  try {
    const { courseId, paymentMethod = "card" } = req.body;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "courseId is required to purchase a course."
      });
    }

    const course = await db.courses.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found."
      });
    }

    // Check if already purchased
    const existingPurchase = await db.purchases.findOne({
      userId: req.userId,
      courseId: courseId
    });

    if (existingPurchase) {
      return res.status(400).json({
        success: false,
        message: "You have already enrolled in this course! Check your learning dashboard."
      });
    }

    // Create Purchase Record
    const purchase = await db.purchases.create({
      userId: req.userId,
      courseId: course._id || course.id,
      pricePaid: course.price,
      status: "completed",
      paymentMethod,
      purchasedAt: new Date(),
      completedLessons: [],
      progressPercentage: 0
    });

    // Increment enrolled count
    await db.courses.findByIdAndUpdate(courseId, {
      enrolledCount: (course.enrolledCount || 0) + 1
    });

    return res.status(201).json({
      success: true,
      message: `🎉 Congratulations! You have successfully enrolled in "${course.title}".`,
      purchaseId: purchase._id || purchase.id,
      course: {
        id: course._id || course.id,
        title: course.title,
        price: course.price
      }
    });
  } catch (error) {
    console.error("Purchase Course Error:", error);
    return res.status(500).json({
      success: false,
      message: "Purchase failed. Please try again.",
      error: error.message
    });
  }
});

// Submit a Course Review
courseRouter.post("/:id/review", userMiddleware, async function (req, res) {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({
        success: false,
        message: "Rating (1-5) and comment are required."
      });
    }

    const user = await db.users.findById(req.userId);
    const course = await db.courses.findById(id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found."
      });
    }

    const review = await db.reviews.create({
      courseId: id,
      userId: req.userId,
      userName: user ? `${user.firstName} ${user.lastName}` : "Verified Student",
      userAvatar: user ? user.avatar : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      rating: Number(rating),
      comment
    });

    // Update course average rating
    const allReviews = await db.reviews.find({ courseId: id });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await db.courses.findByIdAndUpdate(id, {
      rating: Number(avgRating.toFixed(1)),
      reviewsCount: allReviews.length
    });

    return res.status(201).json({
      success: true,
      message: "Thank you! Your review has been submitted.",
      review
    });
  } catch (error) {
    console.error("Submit Review Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit review.",
      error: error.message
    });
  }
});

module.exports = {
  courseRouter
};
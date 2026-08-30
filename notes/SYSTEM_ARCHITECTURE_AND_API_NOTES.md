# 📐 Lumina Learn — System Architecture & API Reference Notes

---

## 1. System Architecture Diagram

```text
[ Client Web App (HTML5 / Vanilla CSS / Modern JS) ]
                     │
                     ▼
           [ Express REST API ]
     ┌───────────────┼──────────────┐
     ▼               ▼              ▼
[/api/v1/user] [/api/v1/course] [/api/v1/admin]
     │               │              │
[User JWT Auth]  [Public & Auth] [Admin JWT Auth]
     └───────────────┬──────────────┘
                     ▼
            [ Universal Query Layer ]
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
  [ MongoDB / Mongoose ]   [ In-Memory Store ]
    (If Connected)           (Offline Fallback)
```

---

## 2. Complete REST API Specifications

### Public Endpoints
- `GET /api/health`: Health status and service timestamp.
- `GET /api/v1/course/preview`: Returns array of courses matching query filters (`category`, `search`, `level`, `sort`).
- `GET /api/v1/course/categories`: Returns distinct category names and course counts.
- `GET /api/v1/course/:id`: Returns single course object with associated reviews.
- `POST /api/v1/user/signup`: Body: `{ email, password, firstName, lastName }`. Returns `201 Created` with JWT.
- `POST /api/v1/user/signin`: Body: `{ email, password }`. Returns `200 OK` with JWT.
- `POST /api/v1/admin/signup`: Body: `{ email, password, firstName, lastName, title, bio }`. Returns `201 Created` with Admin JWT.
- `POST /api/v1/admin/signin`: Body: `{ email, password }`. Returns `200 OK` with Admin JWT.

### Protected Student Endpoints (`Authorization: Bearer <user_token>`)
- `GET /api/v1/user/profile`: Returns student metadata and enrollment count.
- `PUT /api/v1/user/profile`: Body: `{ firstName, lastName, avatar }`. Returns updated user.
- `GET /api/v1/user/purchases`: Returns array of enrolled courses with progress.
- `POST /api/v1/course/purchase`: Body: `{ courseId }`. Enrolls student and increments course sales.
- `POST /api/v1/course/:id/review`: Body: `{ rating, comment }`. Recalculates course average rating.
- `POST /api/v1/user/progress`: Body: `{ courseId, lessonId }`. Updates completed lessons and progress percentage.

### Protected Admin Endpoints (`Authorization: Bearer <admin_token>`)
- `GET /api/v1/admin/profile`: Returns instructor profile and course count.
- `GET /api/v1/admin/analytics`: Returns `{ totalRevenue, totalStudents, totalSales, totalCourses, courseStats }`.
- `GET /api/v1/admin/course/bulk`: Returns all courses created by instructors.
- `POST /api/v1/admin/course`: Body: Full course object. Publishes course.
- `PUT /api/v1/admin/course/:id`: Body: Fields to update.
- `DELETE /api/v1/admin/course/:id`: Deletes course from catalog.

---

## 3. Database Schema Models

### User Schema (`userModel`)
```javascript
{
  email: { type: String, unique: true, required: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  avatar: { type: String },
  role: { type: String, default: "user" },
  createdAt: { type: Date, default: Date.now }
}
```

### Course Schema (`courseModel`)
```javascript
{
  title: { type: String, required: true },
  subtitle: { type: String },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  imageUrl: { type: String, required: true },
  category: { type: String, default: "Web Development" },
  level: { type: String, default: "All Levels" },
  duration: { type: String, default: "32 Hours" },
  lessonsCount: { type: Number, default: 48 },
  rating: { type: Number, default: 4.9 },
  reviewsCount: { type: Number, default: 120 },
  enrolledCount: { type: Number, default: 1250 },
  instructorId: { type: mongoose.Schema.Types.ObjectId, ref: "admin" },
  instructorName: { type: String },
  instructorAvatar: { type: String },
  highlights: [{ type: String }],
  curriculum: [{
    title: { type: String, required: true },
    lessons: [{
      title: { type: String, required: true },
      duration: { type: String },
      videoUrl: { type: String },
      summary: { type: String },
      isPreview: { type: Boolean, default: false }
    }]
  }],
  tags: [{ type: String }],
  featured: { type: Boolean, default: false },
  bestseller: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}
```

### Purchase Schema (`purchaseModel`)
```javascript
{
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "course", required: true },
  pricePaid: { type: Number, required: true },
  purchasedAt: { type: Date, default: Date.now },
  status: { type: String, default: "completed" },
  completedLessons: [{ type: String }],
  progressPercentage: { type: Number, default: 0 }
}
```

# 🎓 Lumina Learn — Complete Interview Preparation Guide & Notes

This guide contains everything you need to know about the **Lumina Learn Course-Selling App** to speak with confidence in full-stack, backend, or JavaScript engineering interviews.

- **Live Deployed App:** [https://course-selling-app-sxn6.onrender.com](https://course-selling-app-sxn6.onrender.com)
- **GitHub Repository:** [https://github.com/aribanaz11/Course-Selling-App](https://github.com/aribanaz11/Course-Selling-App)

---

## 📌 1. The 60-Second Elevator Pitch

> **Question:** *"Tell me about this project."*

**Your Answer:**
> *"I built **Lumina Learn**, a full-stack EdTech course selling marketplace and student LMS. 
> On the **backend**, it uses **Node.js** and **Express** with a **dual-secret JWT Role-Based Access Control (RBAC)** system that securely separates student and instructor capabilities. I designed a resilient database layer using **Mongoose** with an automatic **in-memory fallback** and seed engine so the app runs out-of-the-box in any environment.
> On the **frontend**, I built a responsive, dark-mode glassmorphic Single Page Application in **HTML5, Vanilla CSS, and modern JavaScript** featuring real-time course multi-filtering, video curriculum players, progress tracking, and an Instructor Analytics dashboard.
> I also included a 13-point automated integration test suite and containerized the entire stack with **Docker** and **Docker Compose**."*

---

## 📂 2. Folder-by-Folder & File-by-File Breakdown

### 🔹 Root Directory
- **`config.js`**: Environment variable abstraction with `dotenv`. Centralizes configuration for ports, database URLs, and JWT secrets.
- **`db.js`**: Hybrid data layer. Defines 5 Mongoose schemas (`User`, `Admin`, `Course`, `Purchase`, `Review`) and provides an automatic in-memory fallback query layer (`db.*`) when MongoDB is offline.
- **`index.js`**: Express server entry point. Configures middleware (`cors`, `json`, `urlencoded`), static asset serving (`/public`), REST API routes, health check (`/api/health`), SPA route fallback, and programmatic export for automated testing.
- **`package.json`**: Project metadata, scripts (`start`, `dev`, `test`), and dependencies.
- **`test.js`**: Self-contained automated integration test suite testing 13 core REST API endpoints.

---

### 🔹 `/middleware` — Authentication & Security
- **`middleware/user.js`**: Validates JWTs signed with `JWT_USER_PASSWORD` from headers (`Authorization: Bearer <token>` or `token`). Attaches `req.userId` and `req.user` to the request.
- **`middleware/admin.js`**: Validates JWTs signed with `JWT_ADMIN_PASSWORD` from headers. Attaches `req.adminId` and `req.admin` to ensure instructor privileges.

---

### 🔹 `/routes` — API Controllers & Business Logic
- **`routes/user.js`**:
  - `POST /signup`: Hashes password with bcrypt (10 rounds), saves student, generates JWT.
  - `POST /signin`: Compares bcrypt hash, generates JWT.
  - `GET /profile` & `PUT /profile`: Fetches/updates student profile.
  - `GET /purchases`: Returns enrolled courses with resolved details.
  - `POST /progress`: Marks completed lessons and calculates completion percentage:
    $$\text{Progress \%} = \frac{\text{Completed Lessons}}{\text{Total Curriculum Lessons}} \times 100$$
- **`routes/course.js`**:
  - `GET /categories`: Aggregates course counts per category.
  - `GET /preview`: Advanced multi-filter (category, level, multi-field search, sorting by price/rating/popularity/recency).
  - `GET /:id`: Retrieves single course details and student reviews.
  - `POST /purchase`: Enrolls student, prevents duplicate purchases, increments `enrolledCount`.
  - `POST /:id/review`: Submits rating and dynamically updates course average rating.
- **`routes/admin.js`**:
  - `POST /signup` & `POST /signin`: Instructor authentication.
  - `GET /analytics`: Computes gross revenue, unique students, total sales, and course performance.
  - `POST /course`, `PUT /course/:id`, `DELETE /course/:id`: Full course CRUD with curriculum array manipulation.

---

### 🔹 `/public` — Frontend Single Page Application (SPA)
- **`public/index.html`**: Semantic layout containing `view-home` (marketplace), `view-my-learning` (student LMS), `view-admin` (Creator Studio), and interactive modal dialogs.
- **`public/css/styles.css`**: Design system using CSS variables, dark-mode glassmorphism, responsive grid/flexbox layouts, and keyframe animations.
- **`public/js/api.js`**: Universal fetch client injecting Bearer headers, managing `localStorage` auth state, and rendering dynamic toast notifications.
- **`public/js/app.js`**: Application controller handling real-time search debouncing, category filtering, view switching, video modal controls, and 1-click demo logins.

---

## 💡 3. Top Technical Interview Q&A

### Q1: Why separate JWT secrets for students and admins?
> **Answer:** *"Using separate secrets (`JWT_USER_PASSWORD` vs `JWT_ADMIN_PASSWORD`) provides cryptographic privilege separation. Even if a user alters the payload of a student token to claim `role: "admin"`, verification against the admin secret fails automatically. This stops privilege escalation attacks at the cryptographic signature level."*

### Q2: How does your in-memory fallback work?
> **Answer:** *"In `db.js`, `connectDB()` attempts to connect to MongoDB with a 2-second timeout. If MongoDB is unreachable, it logs a graceful notice and routes queries through an in-memory mock store pre-seeded with realistic data. This ensures zero downtime during local testing, CI pipelines, or demos."*

### Q3: How do you prevent rainbow table attacks on passwords?
> **Answer:** *"Passwords are hashed using `bcryptjs` with a salt round factor of 10. The salt adds random entropy per password, neutralizing rainbow table attacks, and the adaptive cost factor makes brute-force attacks computationally prohibitive."*

### Q4: How does SPA routing work with Express?
> **Answer:** *"Express serves API endpoints under `/api/*`. For any other GET route, a wildcard route `app.get('*')` serves `index.html`. This allows client-side JavaScript to manage routes without 404 errors on page reload."*

### Q5: How would you scale this to 100,000+ concurrent users?
> 1. **Horizontal Scaling**: Stateless JWTs allow multiple container instances behind an NGINX/ALB load balancer.
> 2. **Database Indexing**: Add indexes on `course.category`, `course.title`, and compound indexes on `purchases (userId, courseId)`.
> 3. **Redis Caching**: Cache public course previews and categories with a 5-minute TTL.
> 4. **CDN Video Streaming**: Offload media delivery to AWS S3/Cloudflare R2 behind a global CDN.

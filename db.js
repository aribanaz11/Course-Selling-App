const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { MONGO_URL } = require("./config");

// Database Schemas
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  avatar: { type: String, default: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" },
  role: { type: String, default: "user" },
  createdAt: { type: Date, default: Date.now }
});

const adminSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  avatar: { type: String, default: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80" },
  title: { type: String, default: "Lead Instructor & Architect" },
  bio: { type: String, default: "10+ years engineering leader crafting scalable systems and mentoring 50k+ developers." },
  createdAt: { type: Date, default: Date.now }
});

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  duration: { type: String, default: "15 min" },
  videoUrl: { type: String, default: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" },
  summary: { type: String, default: "" },
  isPreview: { type: Boolean, default: false }
});

const sectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  lessons: [lessonSchema]
});

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: { type: String, default: "" },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number, default: 0 },
  imageUrl: { type: String, required: true },
  category: { type: String, default: "Web Development" },
  level: { type: String, default: "All Levels" },
  duration: { type: String, default: "32 Hours" },
  lessonsCount: { type: Number, default: 48 },
  rating: { type: Number, default: 4.9 },
  reviewsCount: { type: Number, default: 120 },
  enrolledCount: { type: Number, default: 1250 },
  instructorId: { type: mongoose.Schema.Types.ObjectId, ref: "admin" },
  instructorName: { type: String, default: "Sarah Jenkins" },
  instructorAvatar: { type: String, default: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80" },
  highlights: [{ type: String }],
  curriculum: [sectionSchema],
  tags: [{ type: String }],
  featured: { type: Boolean, default: false },
  bestseller: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const purchaseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "course", required: true },
  pricePaid: { type: Number, required: true },
  purchasedAt: { type: Date, default: Date.now },
  status: { type: String, default: "completed" },
  completedLessons: [{ type: String }],
  progressPercentage: { type: Number, default: 0 }
});

const reviewSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "course", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  userName: { type: String, required: true },
  userAvatar: { type: String },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Primary Mongoose Models
const userModel = mongoose.model("user", userSchema);
const adminModel = mongoose.model("admin", adminSchema);
const courseModel = mongoose.model("course", courseSchema);
const purchaseModel = mongoose.model("purchase", purchaseSchema);
const reviewModel = mongoose.model("review", reviewSchema);

// Connection state tracking
let isConnectedToMongo = false;

// In-Memory Resilient Fallback Storage
const inMemoryDB = {
  users: [],
  admins: [],
  courses: [],
  purchases: [],
  reviews: []
};

// Seed realistic demo data into In-Memory store
async function seedInitialData() {
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Demo Admin
  const adminId = "66d000000000000000000001";
  const demoAdmin = {
    _id: adminId,
    id: adminId,
    email: "admin@demo.com",
    password: hashedPassword,
    firstName: "Sarah",
    lastName: "Jenkins",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    title: "Lead Architect & Cloud Specialist",
    bio: "Ex-Staff Engineer at Tech Giants. Over 10 years of experience building distributed systems.",
    createdAt: new Date()
  };

  // Demo Student
  const userId = "66d000000000000000000002";
  const demoUser = {
    _id: userId,
    id: userId,
    email: "student@demo.com",
    password: hashedPassword,
    firstName: "Alex",
    lastName: "Rivera",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    role: "user",
    createdAt: new Date()
  };

  const initialCourses = [
    {
      _id: "66d000000000000000000010",
      id: "66d000000000000000000010",
      title: "Full-Stack Next.js 15, TypeScript & AI SaaS Architecture",
      subtitle: "Build, scale and monetize modern full-stack web applications with Next.js 15, Tailwind, MongoDB & OpenAI APIs.",
      description: "Master modern web development from the ground up to production grade. You will build high-performance web applications using Next.js 15 App Router, React Server Components, TypeScript, TailwindCSS, Mongoose, Clerk Auth, Stripe subscriptions, and AI agent integration.",
      price: 89,
      originalPrice: 149,
      imageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80",
      category: "Web Development",
      level: "All Levels",
      duration: "42 Hours",
      lessonsCount: 54,
      rating: 4.9,
      reviewsCount: 1420,
      enrolledCount: 3850,
      instructorId: adminId,
      instructorName: "Sarah Jenkins",
      instructorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      bestseller: true,
      featured: true,
      highlights: [
        "Complete Next.js 15 App Router & Server Actions",
        "Full-stack TypeScript and clean architectural patterns",
        "Authentication, RBAC, and protected dashboard routes",
        "Database modeling with MongoDB & Mongoose ORM",
        "Stripe checkout, subscriptions, and webhooks",
        "Deploy to Vercel and AWS with custom domains"
      ],
      curriculum: [
        {
          _id: "sec_1",
          title: "Module 1: Modern Web Foundations & Next.js 15 Setup",
          lessons: [
            { _id: "les_1_1", title: "Course Architecture & Roadmap Overview", duration: "12 min", isPreview: true, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", summary: "Learn the architecture of production web applications." },
            { _id: "les_1_2", title: "Setting up Next.js 15 with TypeScript & Tailwind", duration: "24 min", isPreview: true, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", summary: "Initialize modern dev environment with absolute path aliases and ESLint." },
            { _id: "les_1_3", title: "React Server Components vs Client Components", duration: "18 min", isPreview: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", summary: "Deep dive into hydration, server boundaries, and performance gains." }
          ]
        },
        {
          _id: "sec_2",
          title: "Module 2: Database Design, Auth & Backend REST APIs",
          lessons: [
            { _id: "les_2_1", title: "MongoDB Schema Design & Mongoose Setup", duration: "32 min", isPreview: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", summary: "Create normalized schemas with indexes and validation." },
            { _id: "les_2_2", title: "Secure JWT Authentication & Password Hashing", duration: "28 min", isPreview: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4", summary: "Implement bearer tokens and custom auth middleware." },
            { _id: "les_2_3", title: "Building Protected CRUD Endpoints", duration: "35 min", isPreview: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4", summary: "Build rate-limited, validated REST APIs." }
          ]
        },
        {
          _id: "sec_3",
          title: "Module 3: AI Integration, Payments & Production Deployment",
          lessons: [
            { _id: "les_3_1", title: "Connecting OpenAI / Gemini SDK & Streaming Responses", duration: "40 min", isPreview: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4", summary: "Stream AI completions to frontend with SSE." },
            { _id: "les_3_2", title: "Stripe Billing Portal & Webhook Verification", duration: "30 min", isPreview: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4", summary: "Accept payments securely and manage active subscriptions." }
          ]
        }
      ],
      tags: ["Next.js", "React", "Node.js", "MongoDB", "AI", "TypeScript"],
      createdAt: new Date()
    },
    {
      _id: "66d000000000000000000011",
      id: "66d000000000000000000011",
      title: "Generative AI, LangChain & LLM Agent Engineering",
      subtitle: "Build autonomous AI agents, Retrieval-Augmented Generation (RAG) pipelines, and fine-tune open-source models.",
      description: "Step into the future of AI engineering. You will learn to construct production RAG systems with vector databases (Pinecone, ChromaDB, Milvus), orchestrate multi-agent workflows with LangGraph and AutoGen, build custom tools, and deploy scalable LLM microservices.",
      price: 99,
      originalPrice: 199,
      imageUrl: "https://images.unsplash.com/photo-1677442136019-21780efad99a?w=800&auto=format&fit=crop&q=80",
      category: "AI & Machine Learning",
      level: "Intermediate",
      duration: "38 Hours",
      lessonsCount: 46,
      rating: 4.95,
      reviewsCount: 2180,
      enrolledCount: 5400,
      instructorId: adminId,
      instructorName: "Dr. Marcus Vance",
      instructorAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      bestseller: true,
      featured: true,
      highlights: [
        "RAG Architecture from Scratch & Advanced Chunking",
        "Vector Embeddings & Semantic Search with Pinecone",
        "Multi-Agent Orchestration with LangChain & LangGraph",
        "Function Calling, Structured Outputs & Tool Use",
        "Evaluation frameworks: Ragas, TruLens, and DeepEval",
        "Deployment with FastAPI, Docker & GPU cloud servers"
      ],
      curriculum: [
        {
          _id: "sec_ai_1",
          title: "Module 1: Foundations of LLMs and Embeddings",
          lessons: [
            { _id: "les_ai_1", title: "How Large Language Models Work Internally", duration: "25 min", isPreview: true, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", summary: "Transformers, attention mechanisms, and tokenization explained." },
            { _id: "les_ai_2", title: "Vector Embeddings & Cosine Similarity Deep Dive", duration: "30 min", isPreview: true, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", summary: "Generate and store high-dimensional embeddings." }
          ]
        },
        {
          _id: "sec_ai_2",
          title: "Module 2: Production RAG & Knowledge Retrieval",
          lessons: [
            { _id: "les_ai_3", title: "Building a Document Ingestion Pipeline", duration: "45 min", isPreview: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", summary: "Parse PDFs, Markdown, and Web data with smart semantic chunking." },
            { _id: "les_ai_4", title: "Hybrid Search & Re-ranking for Maximum Accuracy", duration: "38 min", isPreview: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", summary: "Combine BM25 keyword search with dense vector similarity." }
          ]
        }
      ],
      tags: ["Python", "LangChain", "LLMs", "RAG", "OpenAI", "Vector DB"],
      createdAt: new Date()
    },
    {
      _id: "66d000000000000000000012",
      id: "66d000000000000000000012",
      title: "Mastering Cloud DevOps: Docker, Kubernetes, Terraform & AWS",
      subtitle: "From containerization to automated GitOps CI/CD pipelines on enterprise Kubernetes infrastructure.",
      description: "Transform into a high-earning DevOps Engineer. Learn to containerize applications with Docker, orchestrate scalable clusters with Kubernetes (EKS/GKE), automate cloud infrastructure with Terraform, and build zero-downtime CI/CD pipelines with GitHub Actions and ArgoCD.",
      price: 95,
      originalPrice: 179,
      imageUrl: "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&auto=format&fit=crop&q=80",
      category: "Cloud & DevOps",
      level: "Advanced",
      duration: "48 Hours",
      lessonsCount: 62,
      rating: 4.88,
      reviewsCount: 950,
      enrolledCount: 2900,
      instructorId: adminId,
      instructorName: "Elena Rostova",
      instructorAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
      bestseller: false,
      featured: true,
      highlights: [
        "Multi-stage Docker builds & minimal image optimization",
        "Production Kubernetes cluster architecture & Helm charts",
        "Terraform Infrastructure as Code (IaC) on AWS",
        "CI/CD pipelines with GitHub Actions & ArgoCD GitOps",
        "Prometheus & Grafana observability and alerting",
        "Security hardening with Trivy and HashiCorp Vault"
      ],
      curriculum: [
        {
          _id: "sec_devops_1",
          title: "Module 1: Docker Deep Dive & Container Optimization",
          lessons: [
            { _id: "les_devops_1", title: "Container Fundamentals & Linux Namespaces", duration: "20 min", isPreview: true, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", summary: "How containers isolate processes." },
            { _id: "les_devops_2", title: "Writing Production-Grade Dockerfiles", duration: "32 min", isPreview: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", summary: "Reduce container size from 1GB to 45MB with Alpine and multi-stage." }
          ]
        }
      ],
      tags: ["Docker", "Kubernetes", "AWS", "Terraform", "CI/CD", "Linux"],
      createdAt: new Date()
    },
    {
      _id: "66d000000000000000000013",
      id: "66d000000000000000000013",
      title: "Flutter & React Native: Cross-Platform Mobile Masterclass",
      subtitle: "Build buttery smooth, publication-ready iOS and Android apps with beautiful native UI and state management.",
      description: "Learn both Flutter (Dart) and React Native (Expo & Bare) to build high-performance mobile apps. Includes offline caching, push notifications, camera integration, biometric login, animated micro-interactions, and App Store / Google Play deployment.",
      price: 79,
      originalPrice: 139,
      imageUrl: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&auto=format&fit=crop&q=80",
      category: "Mobile Development",
      level: "Beginner to Pro",
      duration: "35 Hours",
      lessonsCount: 42,
      rating: 4.85,
      reviewsCount: 1120,
      enrolledCount: 3100,
      instructorId: adminId,
      instructorName: "Sarah Jenkins",
      instructorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      bestseller: false,
      featured: false,
      highlights: [
        "Flutter 3 & Dart modern syntax and widget architecture",
        "React Native with Expo Router & TypeScript",
        "Native device APIs: Camera, Geolocation, Biometrics",
        "State management: Riverpod & Zustand",
        "Push notifications with Firebase Cloud Messaging",
        "App Store & Google Play Store release process"
      ],
      curriculum: [
        {
          _id: "sec_mob_1",
          title: "Module 1: Mobile App Architecture & UI Layouts",
          lessons: [
            { _id: "les_mob_1", title: "Cross-Platform Framework Comparison", duration: "18 min", isPreview: true, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", summary: "Choosing between Flutter and React Native." }
          ]
        }
      ],
      tags: ["Flutter", "React Native", "iOS", "Android", "Mobile", "TypeScript"],
      createdAt: new Date()
    },
    {
      _id: "66d000000000000000000014",
      id: "66d000000000000000000014",
      title: "UI/UX Design Masterclass: Figma to High-Converting Code",
      subtitle: "Master design theory, typography, design systems, modern glassmorphism, and developer handoff.",
      description: "Master modern product design. You will learn visual hierarchy, color theory, typography, creating scalable Figma design tokens, auto-layout 5.0, interactive component variants, wireframing, usability testing, and transforming Figma files into responsive CSS/React code.",
      price: 69,
      originalPrice: 119,
      imageUrl: "https://images.unsplash.com/photo-1581291518655-9523c93269c3?w=800&auto=format&fit=crop&q=80",
      category: "UI/UX Design",
      level: "Beginner",
      duration: "26 Hours",
      lessonsCount: 36,
      rating: 4.92,
      reviewsCount: 870,
      enrolledCount: 2200,
      instructorId: adminId,
      instructorName: "Clara Hughes",
      instructorAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
      bestseller: true,
      featured: true,
      highlights: [
        "Figma master level: Auto Layout, Variables & Tokens",
        "Design systems: Components, Variants & Documentation",
        "UX Research: Personas, Journey Maps & Usability Testing",
        "Micro-interactions & realistic mobile prototyping",
        "Developer handoff with CSS variables and Tailwind tokens"
      ],
      curriculum: [
        {
          _id: "sec_ui_1",
          title: "Module 1: Figma Foundations & Design Systems",
          lessons: [
            { _id: "les_ui_1", title: "The Principles of Modern Digital Design", duration: "16 min", isPreview: true, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", summary: "Visual hierarchy, typography, and contrast." }
          ]
        }
      ],
      tags: ["Figma", "UI Design", "UX Research", "Design Systems", "Prototyping"],
      createdAt: new Date()
    },
    {
      _id: "66d000000000000000000015",
      id: "66d000000000000000000015",
      title: "Cybersecurity & Ethical Hacking: Web App Penetration Testing",
      subtitle: "Learn offensive security, network forensics, OWASP Top 10 vulnerabilities, and bug bounty hunting.",
      description: "Become a certified penetration tester. Learn reconnaissance, network sniffing, SQL injection, XSS, CSRF, API security testing, reverse engineering, exploit development, and writing professional penetration testing audit reports.",
      price: 109,
      originalPrice: 199,
      imageUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=80",
      category: "Cybersecurity",
      level: "Intermediate to Advanced",
      duration: "40 Hours",
      lessonsCount: 50,
      rating: 4.91,
      reviewsCount: 780,
      enrolledCount: 1950,
      instructorId: adminId,
      instructorName: "Victor Sterling",
      instructorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      bestseller: false,
      featured: false,
      highlights: [
        "OWASP Top 10 web application vulnerabilities in depth",
        "Hands-on labs with Burp Suite Pro, Wireshark, & Nmap",
        "API security testing: JWT attacks, IDOR, and SSRF",
        "Privilege escalation on Linux and Windows systems",
        "Bug bounty methodologies and report writing"
      ],
      curriculum: [
        {
          _id: "sec_sec_1",
          title: "Module 1: Ethical Hacking Labs & Reconnaissance",
          lessons: [
            { _id: "les_sec_1", title: "Setting up Kali Linux & Lab Environment", duration: "22 min", isPreview: true, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", summary: "Virtual machines and safe testing sandboxes." }
          ]
        }
      ],
      tags: ["Cybersecurity", "Ethical Hacking", "OWASP", "Penetration Testing", "Security"],
      createdAt: new Date()
    }
  ];

  // Pre-seed purchase for demo student
  const demoPurchase = {
    _id: "66d000000000000000000030",
    id: "66d000000000000000000030",
    userId: userId,
    courseId: "66d000000000000000000010",
    pricePaid: 89,
    purchasedAt: new Date(Date.now() - 86400000 * 2),
    status: "completed",
    completedLessons: ["les_1_1", "les_1_2"],
    progressPercentage: 35
  };

  const demoReviews = [
    {
      _id: "rev_1",
      courseId: "66d000000000000000000010",
      userId: userId,
      userName: "Alex Rivera",
      userAvatar: demoUser.avatar,
      rating: 5,
      comment: "Hands down the best Next.js 15 course on the internet! The real-world SaaS project helped me land a Senior Frontend position.",
      createdAt: new Date(Date.now() - 86400000)
    },
    {
      _id: "rev_2",
      courseId: "66d000000000000000000010",
      userId: "66d000000000000000000003",
      userName: "David Kim",
      userAvatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
      rating: 5,
      comment: "Incredible depth and clarity. The explanation of Server Components and MongoDB data modeling is unmatched.",
      createdAt: new Date(Date.now() - 86400000 * 3)
    }
  ];

  inMemoryDB.admins = [demoAdmin];
  inMemoryDB.users = [demoUser];
  inMemoryDB.courses = initialCourses;
  inMemoryDB.purchases = [demoPurchase];
  inMemoryDB.reviews = demoReviews;
}

// Connect to MongoDB with graceful fallback
async function connectDB() {
  await seedInitialData();

  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(MONGO_URL, {
      serverSelectionTimeoutMS: 2000
    });
    isConnectedToMongo = true;
    console.log(" Connected to MongoDB successfully at:", MONGO_URL);

    // Sync seed data to MongoDB if empty
    const courseCount = await courseModel.countDocuments();
    if (courseCount === 0) {
      console.log(" Seeding initial courses and demo accounts into MongoDB...");
      for (const admin of inMemoryDB.admins) {
        await adminModel.updateOne({ email: admin.email }, { $set: admin }, { upsert: true });
      }
      for (const user of inMemoryDB.users) {
        await userModel.updateOne({ email: user.email }, { $set: user }, { upsert: true });
      }
      for (const course of inMemoryDB.courses) {
        await courseModel.updateOne({ _id: course._id }, { $set: course }, { upsert: true });
      }
      for (const purchase of inMemoryDB.purchases) {
        await purchaseModel.updateOne({ _id: purchase._id }, { $set: purchase }, { upsert: true });
      }
      for (const review of inMemoryDB.reviews) {
        await reviewModel.updateOne({ _id: review._id }, { $set: review }, { upsert: true });
      }
      console.log(" Seed data synchronized to MongoDB.");
    }
  } catch (err) {
    isConnectedToMongo = false;
    console.log(" MongoDB not reachable. Seamlessly operating in High-Performance Built-in Store mode.");
  }
}

// Universal Query Layer that works seamlessly across MongoDB & In-Memory Store
const db = {
  get isMongo() {
    return isConnectedToMongo;
  },

  // User Operations
  users: {
    async findOne(filter) {
      if (isConnectedToMongo) {
        return await userModel.findOne(filter);
      }
      return inMemoryDB.users.find(u => {
        if (filter.email && u.email.toLowerCase() === filter.email.toLowerCase()) return true;
        if (filter._id && String(u._id) === String(filter._id)) return true;
        return false;
      }) || null;
    },
    async findById(id) {
      if (isConnectedToMongo) {
        return await userModel.findById(id);
      }
      return inMemoryDB.users.find(u => String(u._id) === String(id) || String(u.id) === String(id)) || null;
    },
    async create(userData) {
      if (isConnectedToMongo) {
        return await userModel.create(userData);
      }
      const newId = "user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
      const user = {
        _id: newId,
        id: newId,
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        role: "user",
        createdAt: new Date(),
        ...userData
      };
      inMemoryDB.users.push(user);
      return user;
    },
    async updateById(id, updateData) {
      if (isConnectedToMongo) {
        return await userModel.findByIdAndUpdate(id, updateData, { new: true });
      }
      const user = inMemoryDB.users.find(u => String(u._id) === String(id) || String(u.id) === String(id));
      if (user) Object.assign(user, updateData);
      return user;
    }
  },

  // Admin Operations
  admins: {
    async findOne(filter) {
      if (isConnectedToMongo) {
        return await adminModel.findOne(filter);
      }
      return inMemoryDB.admins.find(a => {
        if (filter.email && a.email.toLowerCase() === filter.email.toLowerCase()) return true;
        if (filter._id && String(a._id) === String(filter._id)) return true;
        return false;
      }) || null;
    },
    async findById(id) {
      if (isConnectedToMongo) {
        return await adminModel.findById(id);
      }
      return inMemoryDB.admins.find(a => String(a._id) === String(id) || String(a.id) === String(id)) || null;
    },
    async create(adminData) {
      if (isConnectedToMongo) {
        return await adminModel.create(adminData);
      }
      const newId = "admin_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
      const admin = {
        _id: newId,
        id: newId,
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        title: "Course Instructor",
        bio: "Passionate educator & software specialist.",
        createdAt: new Date(),
        ...adminData
      };
      inMemoryDB.admins.push(admin);
      return admin;
    }
  },

  // Course Operations
  courses: {
    async find(filter = {}) {
      if (isConnectedToMongo) {
        return await courseModel.find(filter);
      }
      return inMemoryDB.courses.filter(c => {
        if (filter.instructorId && String(c.instructorId) !== String(filter.instructorId)) return false;
        if (filter.category && filter.category !== "All" && c.category !== filter.category) return false;
        return true;
      });
    },
    async findById(id) {
      if (isConnectedToMongo) {
        return await courseModel.findById(id);
      }
      return inMemoryDB.courses.find(c => String(c._id) === String(id) || String(c.id) === String(id)) || null;
    },
    async create(courseData) {
      if (isConnectedToMongo) {
        return await courseModel.create(courseData);
      }
      const newId = "course_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
      const course = {
        _id: newId,
        id: newId,
        rating: 5.0,
        reviewsCount: 0,
        enrolledCount: 0,
        bestseller: false,
        featured: false,
        createdAt: new Date(),
        curriculum: [],
        highlights: [],
        tags: [],
        ...courseData
      };
      inMemoryDB.courses.unshift(course);
      return course;
    },
    async findByIdAndUpdate(id, updateData) {
      if (isConnectedToMongo) {
        return await courseModel.findByIdAndUpdate(id, updateData, { new: true });
      }
      const course = inMemoryDB.courses.find(c => String(c._id) === String(id) || String(c.id) === String(id));
      if (course) Object.assign(course, updateData);
      return course;
    },
    async findByIdAndDelete(id) {
      if (isConnectedToMongo) {
        return await courseModel.findByIdAndDelete(id);
      }
      const index = inMemoryDB.courses.findIndex(c => String(c._id) === String(id) || String(c.id) === String(id));
      if (index !== -1) {
        const deleted = inMemoryDB.courses.splice(index, 1)[0];
        return deleted;
      }
      return null;
    }
  },

  // Purchase Operations
  purchases: {
    async find(filter = {}) {
      if (isConnectedToMongo) {
        return await purchaseModel.find(filter).populate("courseId");
      }
      return inMemoryDB.purchases.filter(p => {
        if (filter.userId && String(p.userId) !== String(filter.userId)) return false;
        if (filter.courseId && String(p.courseId) !== String(filter.courseId)) return false;
        return true;
      });
    },
    async findOne(filter) {
      if (isConnectedToMongo) {
        return await purchaseModel.findOne(filter);
      }
      return inMemoryDB.purchases.find(p => {
        if (filter.userId && String(p.userId) !== String(filter.userId)) return false;
        if (filter.courseId && String(p.courseId) !== String(filter.courseId)) return false;
        return true;
      }) || null;
    },
    async create(purchaseData) {
      if (isConnectedToMongo) {
        return await purchaseModel.create(purchaseData);
      }
      const newId = "purch_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
      const purchase = {
        _id: newId,
        id: newId,
        status: "completed",
        purchasedAt: new Date(),
        completedLessons: [],
        progressPercentage: 0,
        ...purchaseData
      };
      inMemoryDB.purchases.push(purchase);
      return purchase;
    },
    async updateProgress(userId, courseId, lessonId) {
      if (isConnectedToMongo) {
        const purchase = await purchaseModel.findOne({ userId, courseId });
        if (!purchase) return null;
        if (!purchase.completedLessons.includes(lessonId)) {
          purchase.completedLessons.push(lessonId);
        }
        const course = await courseModel.findById(courseId);
        let totalLessons = 1;
        if (course && course.curriculum) {
          totalLessons = course.curriculum.reduce((acc, sec) => acc + (sec.lessons ? sec.lessons.length : 0), 0) || 1;
        }
        purchase.progressPercentage = Math.min(100, Math.round((purchase.completedLessons.length / totalLessons) * 100));
        await purchase.save();
        return purchase;
      }

      const purchase = inMemoryDB.purchases.find(p => String(p.userId) === String(userId) && String(p.courseId) === String(courseId));
      if (!purchase) return null;
      if (!purchase.completedLessons) purchase.completedLessons = [];
      if (!purchase.completedLessons.includes(lessonId)) {
        purchase.completedLessons.push(lessonId);
      }
      const course = inMemoryDB.courses.find(c => String(c._id) === String(courseId) || String(c.id) === String(courseId));
      let totalLessons = 1;
      if (course && course.curriculum) {
        totalLessons = course.curriculum.reduce((acc, sec) => acc + (sec.lessons ? sec.lessons.length : 0), 0) || 1;
      }
      purchase.progressPercentage = Math.min(100, Math.round((purchase.completedLessons.length / totalLessons) * 100));
      return purchase;
    }
  },

  // Review Operations
  reviews: {
    async find(filter = {}) {
      if (isConnectedToMongo) {
        return await reviewModel.find(filter).sort({ createdAt: -1 });
      }
      return inMemoryDB.reviews.filter(r => {
        if (filter.courseId && String(r.courseId) !== String(filter.courseId)) return false;
        return true;
      });
    },
    async create(reviewData) {
      if (isConnectedToMongo) {
        return await reviewModel.create(reviewData);
      }
      const newId = "rev_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
      const review = {
        _id: newId,
        id: newId,
        createdAt: new Date(),
        ...reviewData
      };
      inMemoryDB.reviews.unshift(review);
      return review;
    }
  }
};

module.exports = {
  connectDB,
  db,
  userModel,
  adminModel,
  courseModel,
  purchaseModel,
  reviewModel
};
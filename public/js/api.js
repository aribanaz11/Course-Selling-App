/**
 * LUMINA LEARN - REST API & CLIENT STATE MANAGER
 */

const API_BASE = ""; // Relative to server root

const state = {
  token: localStorage.getItem("lumina_token") || null,
  role: localStorage.getItem("lumina_role") || null, // 'user' | 'admin'
  user: JSON.parse(localStorage.getItem("lumina_user") || "null"),
  currentCourse: null,
  activePurchases: []
};

// Toast Notification Manager
function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  
  const icon = type === "success" 
    ? `<i class="fa-solid fa-circle-check" style="color: #34d399; font-size: 1.1rem;"></i>`
    : `<i class="fa-solid fa-triangle-exclamation" style="color: #fb7185; font-size: 1.1rem;"></i>`;

  toast.innerHTML = `
    ${icon}
    <div style="flex-grow: 1;">${message}</div>
    <button onclick="this.parentElement.remove()" style="background:none; border:none; color:#94a3b8; cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(50px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Universal Request Helper
async function apiRequest(endpoint, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (state.token) {
    headers["Authorization"] = `Bearer ${state.token}`;
    headers["token"] = state.token;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({ success: false, message: "Invalid server response." }));

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
}

const api = {
  // Auth Functions
  async loginUser(email, password) {
    const data = await apiRequest("/api/v1/user/signin", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    if (data.success && data.token) {
      state.token = data.token;
      state.role = "user";
      state.user = data.user;
      localStorage.setItem("lumina_token", data.token);
      localStorage.setItem("lumina_role", "user");
      localStorage.setItem("lumina_user", JSON.stringify(data.user));
    }
    return data;
  },

  async signupUser(userData) {
    const data = await apiRequest("/api/v1/user/signup", {
      method: "POST",
      body: JSON.stringify(userData)
    });
    if (data.success && data.token) {
      state.token = data.token;
      state.role = "user";
      state.user = data.user;
      localStorage.setItem("lumina_token", data.token);
      localStorage.setItem("lumina_role", "user");
      localStorage.setItem("lumina_user", JSON.stringify(data.user));
    }
    return data;
  },

  async loginAdmin(email, password) {
    const data = await apiRequest("/api/v1/admin/signin", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    if (data.success && data.token) {
      state.token = data.token;
      state.role = "admin";
      state.user = data.admin;
      localStorage.setItem("lumina_token", data.token);
      localStorage.setItem("lumina_role", "admin");
      localStorage.setItem("lumina_user", JSON.stringify(data.admin));
    }
    return data;
  },

  async signupAdmin(adminData) {
    const data = await apiRequest("/api/v1/admin/signup", {
      method: "POST",
      body: JSON.stringify(adminData)
    });
    if (data.success && data.token) {
      state.token = data.token;
      state.role = "admin";
      state.user = data.admin;
      localStorage.setItem("lumina_token", data.token);
      localStorage.setItem("lumina_role", "admin");
      localStorage.setItem("lumina_user", JSON.stringify(data.admin));
    }
    return data;
  },

  logout() {
    state.token = null;
    state.role = null;
    state.user = null;
    localStorage.removeItem("lumina_token");
    localStorage.removeItem("lumina_role");
    localStorage.removeItem("lumina_user");
  },

  // Courses
  async getCourses(filters = {}) {
    const query = new URLSearchParams();
    if (filters.category) query.append("category", filters.category);
    if (filters.search) query.append("search", filters.search);
    if (filters.level) query.append("level", filters.level);
    if (filters.sort) query.append("sort", filters.sort);

    return await apiRequest(`/api/v1/course/preview?${query.toString()}`);
  },

  async getCategories() {
    return await apiRequest("/api/v1/course/categories");
  },

  async getCourseById(id) {
    return await apiRequest(`/api/v1/course/${id}`);
  },

  async purchaseCourse(courseId, paymentMethod = "card") {
    return await apiRequest("/api/v1/course/purchase", {
      method: "POST",
      body: JSON.stringify({ courseId, paymentMethod })
    });
  },

  async submitReview(courseId, rating, comment) {
    return await apiRequest(`/api/v1/course/${courseId}/review`, {
      method: "POST",
      body: JSON.stringify({ rating, comment })
    });
  },

  // Student Learning & Purchases
  async getPurchases() {
    return await apiRequest("/api/v1/user/purchases");
  },

  async updateProgress(courseId, lessonId) {
    return await apiRequest("/api/v1/user/progress", {
      method: "POST",
      body: JSON.stringify({ courseId, lessonId })
    });
  },

  // Admin Studio
  async getAdminCourses() {
    return await apiRequest("/api/v1/admin/course/bulk");
  },

  async getAdminAnalytics() {
    return await apiRequest("/api/v1/admin/analytics");
  },

  async createCourse(courseData) {
    return await apiRequest("/api/v1/admin/course", {
      method: "POST",
      body: JSON.stringify(courseData)
    });
  },

  async updateCourse(courseId, courseData) {
    return await apiRequest(`/api/v1/admin/course/${courseId}`, {
      method: "PUT",
      body: JSON.stringify(courseData)
    });
  },

  async deleteCourse(courseId) {
    return await apiRequest(`/api/v1/admin/course/${courseId}`, {
      method: "DELETE"
    });
  }
};

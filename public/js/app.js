/**
 * LUMINA LEARN - MAIN APPLICATION CONTROLLER
 */

// Application State
let allCourses = [];
let allCategories = [];
let userPurchases = [];
let activeLearningCourse = null;
let activeLesson = null;
let editingCourseId = null;

// DOM Ready Initialization
document.addEventListener("DOMContentLoaded", async () => {
  updateAuthUI();
  initEventListeners();
  await loadCategories();
  await loadCourses();
  
  if (state.token && state.role === "user") {
    loadUserPurchases();
  }
});

// Update Header / Auth UI
function updateAuthUI() {
  const guestNav = document.getElementById("guestNavActions");
  const userNav = document.getElementById("userNavActions");
  const userAvatarImg = document.getElementById("userAvatarImg");
  const userDisplayName = document.getElementById("userDisplayName");
  const userDropdownName = document.getElementById("dropdownUserName");
  const userDropdownEmail = document.getElementById("dropdownUserEmail");
  const adminStudioLink = document.getElementById("adminStudioLink");
  const myLearningLink = document.getElementById("myLearningLink");

  if (state.token && state.user) {
    if (guestNav) guestNav.style.display = "none";
    if (userNav) userNav.style.display = "flex";

    const name = state.user.firstName ? `${state.user.firstName} ${state.user.lastName || ""}` : "Member";
    if (userAvatarImg) userAvatarImg.src = state.user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";
    if (userDisplayName) userDisplayName.textContent = state.user.firstName || "Account";
    if (userDropdownName) userDropdownName.textContent = name;
    if (userDropdownEmail) userDropdownEmail.textContent = state.user.email || "";

    if (state.role === "admin") {
      if (adminStudioLink) adminStudioLink.style.display = "flex";
      if (myLearningLink) myLearningLink.style.display = "none";
    } else {
      if (adminStudioLink) adminStudioLink.style.display = "none";
      if (myLearningLink) myLearningLink.style.display = "flex";
    }
  } else {
    if (guestNav) guestNav.style.display = "flex";
    if (userNav) userNav.style.display = "none";
    if (adminStudioLink) adminStudioLink.style.display = "none";
    if (myLearningLink) myLearningLink.style.display = "none";
  }
}

// Switch Views
function showView(viewId) {
  document.querySelectorAll(".view-section").forEach(sec => sec.style.display = "none");
  const target = document.getElementById(viewId);
  if (target) {
    target.style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Update Nav links active state
  document.querySelectorAll(".nav-link").forEach(link => link.classList.remove("active"));
  const activeLink = document.querySelector(`.nav-link[data-view="${viewId}"]`);
  if (activeLink) activeLink.classList.add("active");

  // View specific loaders
  if (viewId === "view-admin") {
    loadAdminStudio();
  } else if (viewId === "view-my-learning") {
    loadMyLearningDashboard();
  }
}

// Load Categories
async function loadCategories() {
  try {
    const res = await api.getCategories();
    if (res.success) {
      allCategories = res.categories;
      renderCategoryPills(res.categories);
    }
  } catch (err) {
    console.error("Failed to load categories:", err);
  }
}

function renderCategoryPills(categories) {
  const container = document.getElementById("categoryPillsContainer");
  if (!container) return;

  let html = `<button class="cat-pill active" onclick="filterByCategory('All', this)">All Courses</button>`;
  categories.forEach(cat => {
    html += `<button class="cat-pill" onclick="filterByCategory('${cat.name}', this)">${cat.name} (${cat.count})</button>`;
  });
  container.innerHTML = html;
}

// Load Courses
async function loadCourses() {
  const grid = document.getElementById("coursesGrid");
  if (grid) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 60px; color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><p style="margin-top: 12px;">Discovering premier courses...</p></div>`;
  }

  try {
    const searchVal = document.getElementById("courseSearchInput")?.value || "";
    const sortVal = document.getElementById("courseSortSelect")?.value || "default";
    const levelVal = document.getElementById("courseLevelSelect")?.value || "All";
    const activeCatPill = document.querySelector(".cat-pill.active");
    const categoryVal = activeCatPill ? activeCatPill.textContent.split(" (")[0] : "All";

    const res = await api.getCourses({
      search: searchVal,
      sort: sortVal,
      level: levelVal,
      category: categoryVal === "All Courses" ? "All" : categoryVal
    });

    if (res.success) {
      allCourses = res.courses;
      renderCourses(allCourses);
    }
  } catch (err) {
    console.error("Failed to load courses:", err);
    if (grid) grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #fb7185; padding: 40px;">Failed to load courses. Please try refreshing.</div>`;
  }
}

// Render Course Cards
function renderCourses(courses) {
  const grid = document.getElementById("coursesGrid");
  const countBadge = document.getElementById("coursesCountBadge");
  if (countBadge) countBadge.textContent = `${courses.length} Courses Available`;

  if (!grid) return;

  if (courses.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 80px 20px; background: var(--bg-card); border-radius: var(--radius-xl); border: 1px dashed var(--border-subtle);">
        <i class="fa-solid fa-graduation-cap" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 16px;"></i>
        <h3>No courses found matching your criteria</h3>
        <p style="color: var(--text-secondary); margin-top: 8px;">Try clearing your search query or selecting a different category.</p>
        <button class="btn btn-secondary btn-sm" onclick="resetFilters()" style="margin-top: 20px;">Reset All Filters</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = courses.map(course => {
    const isEnrolled = userPurchases.some(p => String(p.course?._id || p.courseId) === String(course._id || course.id));
    const badgeHtml = course.bestseller 
      ? `<span class="badge badge-gold"><i class="fa-solid fa-fire"></i> Bestseller</span>`
      : (course.featured ? `<span class="badge badge-primary"><i class="fa-solid fa-star"></i> Featured</span>` : `<span class="badge badge-cyan">${course.level || "All Levels"}</span>`);

    return `
      <div class="course-card">
        <div class="course-card-thumb">
          <img src="${course.imageUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'}" alt="${course.title}" loading="lazy">
          <div class="course-card-badge-wrap">
            ${badgeHtml}
          </div>
        </div>
        <div class="course-card-body">
          <div class="course-card-header-meta">
            <span style="color: var(--primary-light); font-weight: 600;"><i class="fa-solid fa-folder-open"></i> ${course.category || 'Tech'}</span>
            <span><i class="fa-solid fa-star" style="color: #fbbf24;"></i> <strong>${course.rating || 4.9}</strong> (${course.reviewsCount || 100}+)</span>
          </div>

          <h3 class="course-card-title" title="${course.title}">${course.title}</h3>
          <p class="course-card-desc">${course.subtitle || course.description}</p>

          <div class="course-card-instructor">
            <img class="instructor-avatar" src="${course.instructorAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}" alt="${course.instructorName}">
            <div>
              <div class="instructor-name">${course.instructorName || 'Lead Instructor'}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);"><i class="fa-regular fa-clock"></i> ${course.duration || '30h'} • ${course.lessonsCount || 40} Lessons</div>
            </div>
          </div>

          <div class="course-card-footer">
            <div class="course-price-wrap">
              <span class="course-price-current">$${course.price}</span>
              ${course.originalPrice ? `<span class="course-price-original">$${course.originalPrice}</span>` : ''}
            </div>

            <div class="course-card-actions">
              <button class="btn btn-secondary btn-sm" onclick="openCourseDetailsModal('${course._id || course.id}')">
                <i class="fa-regular fa-eye"></i> Details
              </button>
              ${isEnrolled ? `
                <button class="btn btn-primary btn-sm" onclick="startLearningCourse('${course._id || course.id}')">
                  <i class="fa-solid fa-play"></i> Learn
                </button>
              ` : `
                <button class="btn btn-glow btn-sm" onclick="openCheckoutModal('${course._id || course.id}')">
                  <i class="fa-solid fa-bolt"></i> Enroll
                </button>
              `}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

// Filter Actions
function filterByCategory(category, btnElement) {
  document.querySelectorAll(".cat-pill").forEach(p => p.classList.remove("active"));
  if (btnElement) btnElement.classList.add("active");
  loadCourses();
}

function resetFilters() {
  const searchInput = document.getElementById("courseSearchInput");
  const sortSelect = document.getElementById("courseSortSelect");
  const levelSelect = document.getElementById("courseLevelSelect");
  if (searchInput) searchInput.value = "";
  if (sortSelect) sortSelect.value = "default";
  if (levelSelect) levelSelect.value = "All";

  document.querySelectorAll(".cat-pill").forEach((p, idx) => {
    if (idx === 0) p.classList.add("active");
    else p.classList.remove("active");
  });

  loadCourses();
}

// User Purchases
async function loadUserPurchases() {
  try {
    const res = await api.getPurchases();
    if (res.success) {
      userPurchases = res.purchases;
      renderCourses(allCourses); // update button states
    }
  } catch (err) {
    console.error("Failed to load user purchases:", err);
  }
}

// Course Details Modal
async function openCourseDetailsModal(courseId) {
  const modal = document.getElementById("courseDetailsModal");
  const content = document.getElementById("courseDetailsContent");
  if (!modal || !content) return;

  content.innerHTML = `<div style="text-align: center; padding: 50px;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>`;
  modal.classList.add("show");

  try {
    const res = await api.getCourseById(courseId);
    if (!res.success || !res.course) {
      showToast("Course details not found", "error");
      closeModal("courseDetailsModal");
      return;
    }

    const course = res.course;
    const reviews = res.reviews || [];
    const isEnrolled = userPurchases.some(p => String(p.course?._id || p.courseId) === String(course._id || course.id));

    let curriculumHtml = "";
    if (course.curriculum && course.curriculum.length > 0) {
      curriculumHtml = course.curriculum.map((sec, sIdx) => `
        <div class="curriculum-module-box" style="margin-bottom: 12px;">
          <div class="module-header-toggle">
            <span><strong>Module ${sIdx + 1}:</strong> ${sec.title}</span>
            <span style="font-size: 0.8rem; color: var(--text-muted);">${sec.lessons ? sec.lessons.length : 0} Lessons</span>
          </div>
          <div class="module-lessons-list">
            ${(sec.lessons || []).map(l => `
              <div class="lesson-item-row" style="cursor: default;">
                <div class="lesson-left-info">
                  <i class="fa-regular fa-circle-play" style="color: var(--primary-light);"></i>
                  <span>${l.title}</span>
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                  ${l.isPreview ? `<span class="badge badge-emerald" style="font-size:0.65rem;">Free Preview</span>` : ''}
                  <span style="font-size: 0.78rem; color: var(--text-muted);">${l.duration || '15 min'}</span>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      `).join("");
    } else {
      curriculumHtml = `<p style="color: var(--text-muted);">Curriculum details updating soon.</p>`;
    }

    let highlightsHtml = "";
    if (course.highlights && course.highlights.length > 0) {
      highlightsHtml = `
        <div style="background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: var(--radius-lg); padding: 20px; margin: 16px 0;">
          <h4 style="margin-bottom: 12px; color: var(--primary-light);"><i class="fa-solid fa-circle-check"></i> What You'll Learn</h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px;">
            ${course.highlights.map(h => `<div style="font-size: 0.9rem; color: var(--text-secondary); display: flex; gap: 8px;"><i class="fa-solid fa-check" style="color: #34d399; margin-top: 4px;"></i> <span>${h}</span></div>`).join("")}
          </div>
        </div>
      `;
    }

    let reviewsHtml = reviews.length > 0 ? reviews.map(r => `
      <div style="background: var(--bg-tertiary); padding: 14px; border-radius: var(--radius-md); margin-bottom: 10px; border: 1px solid var(--border-subtle);">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <img src="${r.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}" style="width: 28px; height: 28px; border-radius: 50%;">
            <strong style="font-size: 0.9rem;">${r.userName}</strong>
          </div>
          <div>${'⭐'.repeat(r.rating || 5)}</div>
        </div>
        <p style="font-size: 0.88rem; color: var(--text-secondary);">${r.comment}</p>
      </div>
    `).join("") : `<p style="color: var(--text-muted); font-size: 0.9rem;">No reviews yet. Be the first student to review!</p>`;

    content.innerHTML = `
      <div style="position: relative; height: 260px; border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 20px;">
        <img src="${course.imageUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'}" style="width: 100%; height: 100%; object-fit: cover;">
        <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 20px; background: linear-gradient(to top, rgba(9, 13, 22, 0.95), transparent);">
          <span class="badge badge-primary">${course.category}</span>
          <h2 style="font-size: 1.8rem; margin-top: 8px;">${course.title}</h2>
        </div>
      </div>

      <p style="font-size: 1.05rem; color: var(--text-secondary); line-height: 1.6;">${course.description}</p>

      ${highlightsHtml}

      <div style="display: flex; align-items: center; gap: 20px; margin: 16px 0; padding: 14px; background: var(--bg-tertiary); border-radius: var(--radius-md);">
        <img src="${course.instructorAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover;">
        <div>
          <div style="font-weight: 700;">Instructor: ${course.instructorName || 'Sarah Jenkins'}</div>
          <div style="font-size: 0.85rem; color: var(--text-muted);">Lead Instructor • 4.9 Instructor Rating</div>
        </div>
      </div>

      <h3 style="margin: 24px 0 12px;"><i class="fa-solid fa-list-check"></i> Course Curriculum (${course.lessonsCount || 30} Lessons)</h3>
      ${curriculumHtml}

      <h3 style="margin: 24px 0 12px;"><i class="fa-solid fa-comments"></i> Student Reviews (${course.reviewsCount || reviews.length})</h3>
      ${reviewsHtml}

      <div style="position: sticky; bottom: -28px; margin: 24px -28px -28px; padding: 20px 28px; background: var(--bg-secondary); border-top: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; z-index: 10;">
        <div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">Lifetime Access</div>
          <div style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 800; color: #ffffff;">$${course.price} <span style="font-size: 0.95rem; color: var(--text-muted); text-decoration: line-through;">$${course.originalPrice || (course.price * 1.6).toFixed(0)}</span></div>
        </div>
        ${isEnrolled ? `
          <button class="btn btn-primary btn-lg" onclick="closeModal('courseDetailsModal'); startLearningCourse('${course._id || course.id}')">
            <i class="fa-solid fa-play"></i> Continue Learning
          </button>
        ` : `
          <button class="btn btn-glow btn-lg" onclick="closeModal('courseDetailsModal'); openCheckoutModal('${course._id || course.id}')">
            <i class="fa-solid fa-bolt"></i> Enroll Now - $${course.price}
          </button>
        `}
      </div>
    `;
  } catch (err) {
    console.error("Course Details Error:", err);
    content.innerHTML = `<div style="color: #fb7185; padding: 20px;">Failed to load course details.</div>`;
  }
}

// Checkout Modal & Simulator
let selectedCourseToBuy = null;
async function openCheckoutModal(courseId) {
  if (!state.token) {
    showToast("Please sign in or use demo login to purchase courses.", "error");
    openAuthModal("signin", "user");
    return;
  }

  const course = allCourses.find(c => String(c._id || c.id) === String(courseId));
  if (!course) {
    showToast("Course not found", "error");
    return;
  }

  selectedCourseToBuy = course;
  const modal = document.getElementById("checkoutModal");
  const courseSummary = document.getElementById("checkoutCourseSummary");
  const priceDisplay = document.getElementById("checkoutPriceDisplay");
  const totalDisplay = document.getElementById("checkoutTotalDisplay");

  if (courseSummary) {
    courseSummary.innerHTML = `
      <div style="display: flex; gap: 14px; align-items: center;">
        <img src="${course.imageUrl}" style="width: 70px; height: 50px; border-radius: var(--radius-sm); object-fit: cover;">
        <div>
          <strong style="font-size: 0.95rem;">${course.title}</strong>
          <div style="font-size: 0.8rem; color: var(--text-muted);">${course.instructorName} • ${course.duration}</div>
        </div>
      </div>
    `;
  }

  if (priceDisplay) priceDisplay.textContent = `$${course.price}.00`;
  if (totalDisplay) totalDisplay.textContent = `$${course.price}.00`;

  modal.classList.add("show");
}

async function processPayment(paymentMethod = "demo_instant") {
  if (!selectedCourseToBuy) return;

  const btn = document.getElementById("confirmPurchaseBtn");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Securing Enrollment...`;
  }

  try {
    const res = await api.purchaseCourse(selectedCourseToBuy._id || selectedCourseToBuy.id, paymentMethod);
    if (res.success) {
      showToast(`🎉 ${res.message}`, "success");
      closeModal("checkoutModal");
      await loadUserPurchases();
      startLearningCourse(selectedCourseToBuy._id || selectedCourseToBuy.id);
    }
  } catch (err) {
    showToast(err.message || "Purchase could not be processed", "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-lock"></i> Complete Instant Enrollment`;
    }
  }
}

// Student Learning Player
async function startLearningCourse(courseId) {
  showView("view-player");
  const playerContainer = document.getElementById("playerViewContainer");
  if (!playerContainer) return;

  playerContainer.innerHTML = `<div style="text-align: center; padding: 80px;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><p style="margin-top: 12px;">Opening classroom...</p></div>`;

  try {
    const res = await api.getCourseById(courseId);
    if (!res.success || !res.course) {
      showToast("Course player unavailable", "error");
      showView("view-home");
      return;
    }

    activeLearningCourse = res.course;
    const purchase = userPurchases.find(p => String(p.course?._id || p.courseId) === String(courseId));
    const completedLessons = purchase ? (purchase.completedLessons || []) : [];
    const progress = purchase ? (purchase.progressPercentage || 0) : 0;

    // Pick first lesson
    let firstLesson = null;
    if (activeLearningCourse.curriculum && activeLearningCourse.curriculum.length > 0) {
      for (const sec of activeLearningCourse.curriculum) {
        if (sec.lessons && sec.lessons.length > 0) {
          firstLesson = sec.lessons[0];
          break;
        }
      }
    }

    activeLesson = firstLesson || {
      _id: "demo_1",
      title: "Welcome to " + activeLearningCourse.title,
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      summary: "Welcome to this masterclass! In this lesson we establish the fundamental roadmap."
    };

    renderPlayerUI(completedLessons, progress);
  } catch (err) {
    console.error("Player error:", err);
    showToast("Failed to load player", "error");
  }
}

function renderPlayerUI(completedLessons, progress) {
  const container = document.getElementById("playerViewContainer");
  if (!container || !activeLearningCourse) return;

  const curriculum = activeLearningCourse.curriculum || [];

  container.innerHTML = `
    <div class="player-layout">
      <!-- Main Video & Notes Col -->
      <div class="player-main-col">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <button class="btn btn-secondary btn-sm" onclick="showView('view-my-learning')">
            <i class="fa-solid fa-arrow-left"></i> My Learning Dashboard
          </button>
          <span class="badge badge-emerald"><i class="fa-solid fa-circle-check"></i> Enrolled & Active</span>
        </div>

        <!-- Video Player -->
        <div class="player-video-container">
          <video id="courseVideoPlayer" controls autoplay poster="${activeLearningCourse.imageUrl}">
            <source src="${activeLesson.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'}" type="video/mp4">
            Your browser does not support HTML5 video.
          </video>
        </div>

        <!-- Lesson Header & Controls -->
        <div class="player-content-body">
          <div class="player-lesson-header">
            <div>
              <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Current Lesson</span>
              <h2 class="player-lesson-title" id="activeLessonTitle">${activeLesson.title}</h2>
            </div>
            <div class="player-nav-controls">
              <button class="btn ${completedLessons.includes(activeLesson._id || activeLesson.id) ? 'btn-secondary' : 'btn-primary'} btn-sm" id="completeLessonBtn" onclick="toggleLessonComplete('${activeLesson._id || activeLesson.id}')">
                <i class="fa-solid fa-check-double"></i> ${completedLessons.includes(activeLesson._id || activeLesson.id) ? 'Completed' : 'Mark as Complete'}
              </button>
            </div>
          </div>

          <!-- Player Tabs -->
          <div class="player-tabs">
            <button class="player-tab-btn active" onclick="switchPlayerTab('tab-overview', this)"><i class="fa-solid fa-book-open"></i> Overview & Notes</button>
            <button class="player-tab-btn" onclick="switchPlayerTab('tab-quiz', this)"><i class="fa-solid fa-brain"></i> Interactive Quiz</button>
            <button class="player-tab-btn" onclick="switchPlayerTab('tab-cert', this)"><i class="fa-solid fa-award"></i> Certificate</button>
          </div>

          <!-- Tab 1: Overview -->
          <div class="tab-pane active" id="tab-overview">
            <h4 style="margin-bottom: 8px;">Lesson Summary & Key Concepts</h4>
            <p style="color: var(--text-secondary); line-height: 1.7;" id="activeLessonSummary">${activeLesson.summary || 'In this lesson, you will master the foundational core concepts, best practices, and code implementation patterns required for production systems.'}</p>

            <div style="background: var(--bg-tertiary); padding: 18px; border-radius: var(--radius-md); margin-top: 16px; border: 1px solid var(--border-subtle);">
              <h5 style="margin-bottom: 8px; color: var(--primary-light);"><i class="fa-solid fa-lightbulb"></i> Pro-Tip from Instructor</h5>
              <p style="font-size: 0.88rem; color: var(--text-secondary);">Practice typing the code along with the lesson. Clone the repository and test edge cases locally to solidify muscle memory.</p>
            </div>
          </div>

          <!-- Tab 2: Interactive Quiz -->
          <div class="tab-pane" id="tab-quiz">
            <div class="quiz-box">
              <div class="quiz-question-title">Knowledge Check: Understanding the Key Architecture</div>
              <div class="quiz-options-list">
                <label class="quiz-option-label" onclick="selectQuizOption(this, false)">
                  <input type="radio" name="quiz_opt">
                  <span>A) Execute code without type checks or validation in production</span>
                </label>
                <label class="quiz-option-label" onclick="selectQuizOption(this, true)">
                  <input type="radio" name="quiz_opt">
                  <span>B) Structure modular schemas, validate inputs, and secure endpoints with JWT & RBAC</span>
                </label>
                <label class="quiz-option-label" onclick="selectQuizOption(this, false)">
                  <input type="radio" name="quiz_opt">
                  <span>C) Store plaintext secrets directly inside public frontend components</span>
                </label>
              </div>
              <div id="quizFeedback" style="font-size: 0.9rem; font-weight: 600; display: none;"></div>
            </div>
          </div>

          <!-- Tab 3: Certificate -->
          <div class="tab-pane" id="tab-cert">
            <div class="certificate-preview-card">
              <i class="fa-solid fa-certificate cert-badge"></i>
              <h3 style="text-transform: uppercase; letter-spacing: 0.1em; color: #fbbf24;">Certificate of Completion</h3>
              <p style="font-size: 0.9rem; color: var(--text-secondary);">This proudly certifies that</p>
              <div class="cert-student-name">${state.user ? (state.user.firstName + ' ' + state.user.lastName) : 'Alex Rivera'}</div>
              <p style="font-size: 0.95rem; color: var(--text-secondary);">has successfully completed the comprehensive curriculum for</p>
              <h4 style="color: #ffffff; font-size: 1.25rem;">${activeLearningCourse.title}</h4>
              <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 12px;">Verified by Lumina Learn Academy • Issued on ${new Date().toLocaleDateString()}</div>
              <button class="btn btn-primary btn-sm" onclick="window.print()" style="margin-top: 16px;">
                <i class="fa-solid fa-download"></i> Print / Save Certificate
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Player Sidebar Curriculum -->
      <div class="player-sidebar">
        <div class="sidebar-header">
          <h3>Course Content</h3>
          <div class="progress-bar-container">
            <div class="progress-bar-label">
              <span>Overall Progress</span>
              <strong id="sidebarProgressText">${progress}% Completed</strong>
            </div>
            <div class="progress-track">
              <div class="progress-fill" id="sidebarProgressFill" style="width: ${progress}%;"></div>
            </div>
          </div>
        </div>

        <div class="sidebar-modules-list">
          ${curriculum.map((sec, sIdx) => `
            <div class="curriculum-module-box">
              <div class="module-header-toggle">
                <span>Section ${sIdx + 1}: ${sec.title}</span>
              </div>
              <div class="module-lessons-list">
                ${(sec.lessons || []).map(les => {
                  const isDone = completedLessons.includes(les._id || les.id);
                  const isCurrent = (activeLesson._id || activeLesson.id) === (les._id || les.id);
                  return `
                    <div class="lesson-item-row ${isCurrent ? 'active' : ''}" onclick="selectPlayerLesson('${les._id || les.id}')">
                      <div class="lesson-left-info">
                        <i class="fa-solid ${isDone ? 'fa-circle-check completed' : 'fa-circle'} lesson-check-icon" id="check_${les._id || les.id}"></i>
                        <span style="font-size: 0.85rem;">${les.title}</span>
                      </div>
                      <span style="font-size: 0.75rem; color: var(--text-muted);">${les.duration || '15 min'}</span>
                    </div>
                  `;
                }).join("")}
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `;
}

function selectPlayerLesson(lessonId) {
  if (!activeLearningCourse || !activeLearningCourse.curriculum) return;

  for (const sec of activeLearningCourse.curriculum) {
    for (const les of (sec.lessons || [])) {
      if (String(les._id || les.id) === String(lessonId)) {
        activeLesson = les;
        break;
      }
    }
  }

  const video = document.getElementById("courseVideoPlayer");
  const title = document.getElementById("activeLessonTitle");
  const summary = document.getElementById("activeLessonSummary");

  if (video) {
    video.src = activeLesson.videoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
    video.play().catch(() => {});
  }
  if (title) title.textContent = activeLesson.title;
  if (summary) summary.textContent = activeLesson.summary || "Mastering standard architectures and hands-on implementations.";

  // Update active class in sidebar
  document.querySelectorAll(".lesson-item-row").forEach(row => row.classList.remove("active"));
  const clicked = event?.currentTarget;
  if (clicked) clicked.classList.add("active");
}

async function toggleLessonComplete(lessonId) {
  if (!activeLearningCourse) return;

  try {
    const res = await api.updateProgress(activeLearningCourse._id || activeLearningCourse.id, lessonId);
    if (res.success) {
      showToast("Lesson completed! Progress updated.", "success");
      
      const checkIcon = document.getElementById(`check_${lessonId}`);
      if (checkIcon) {
        checkIcon.className = "fa-solid fa-circle-check completed lesson-check-icon";
      }

      const progressText = document.getElementById("sidebarProgressText");
      const progressFill = document.getElementById("sidebarProgressFill");
      if (progressText) progressText.textContent = `${res.progressPercentage}% Completed`;
      if (progressFill) progressFill.style.width = `${res.progressPercentage}%`;

      const completeBtn = document.getElementById("completeLessonBtn");
      if (completeBtn) {
        completeBtn.className = "btn btn-secondary btn-sm";
        completeBtn.innerHTML = `<i class="fa-solid fa-check-double"></i> Completed`;
      }

      await loadUserPurchases();
    }
  } catch (err) {
    showToast("Failed to update progress", "error");
  }
}

function switchPlayerTab(tabId, btnElement) {
  document.querySelectorAll(".player-tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));

  if (btnElement) btnElement.classList.add("active");
  const target = document.getElementById(tabId);
  if (target) target.classList.add("active");
}

function selectQuizOption(labelElement, isCorrect) {
  const parent = labelElement.parentElement;
  parent.querySelectorAll(".quiz-option-label").forEach(l => {
    l.classList.remove("correct", "wrong");
  });

  const feedback = document.getElementById("quizFeedback");
  if (feedback) {
    feedback.style.display = "block";
    if (isCorrect) {
      labelElement.classList.add("correct");
      feedback.style.color = "#34d399";
      feedback.innerHTML = `<i class="fa-solid fa-circle-check"></i> Correct! Excellent grasp of modular, secure architectural design.`;
    } else {
      labelElement.classList.add("wrong");
      feedback.style.color = "#fb7185";
      feedback.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Incorrect. Review the lesson concepts and try again!`;
    }
  }
}

// Student Dashboard ("My Learning")
async function loadMyLearningDashboard() {
  const container = document.getElementById("myLearningCoursesGrid");
  if (!container) return;

  container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 60px;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>`;

  await loadUserPurchases();

  if (userPurchases.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; background: var(--bg-card); border-radius: var(--radius-xl); border: 1px dashed var(--border-subtle);">
        <i class="fa-solid fa-book-bookmark" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 16px;"></i>
        <h3>You have not enrolled in any courses yet</h3>
        <p style="color: var(--text-secondary); margin-top: 8px;">Explore our catalog to start mastering high-demand skills.</p>
        <button class="btn btn-primary" onclick="showView('view-home')" style="margin-top: 20px;">Explore All Courses</button>
      </div>
    `;
    return;
  }

  container.innerHTML = userPurchases.map(p => {
    const course = p.course || {};
    const progress = p.progressPercentage || 0;

    return `
      <div class="course-card">
        <div class="course-card-thumb">
          <img src="${course.imageUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'}" alt="${course.title}">
          <div class="course-card-badge-wrap">
            <span class="badge badge-emerald"><i class="fa-solid fa-circle-check"></i> Enrolled</span>
          </div>
        </div>
        <div class="course-card-body">
          <span style="color: var(--primary-light); font-size: 0.8rem; font-weight: 600;">${course.category || 'Tech'}</span>
          <h3 class="course-card-title">${course.title || 'Enrolled Masterclass'}</h3>

          <div class="progress-bar-container" style="margin: 8px 0;">
            <div class="progress-bar-label">
              <span>Progress</span>
              <strong>${progress}%</strong>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width: ${progress}%;"></div>
            </div>
          </div>

          <button class="btn btn-primary" onclick="startLearningCourse('${course._id || course.id}')" style="margin-top: auto; width: 100%;">
            <i class="fa-solid fa-play"></i> ${progress > 0 ? 'Resume Learning' : 'Start Course'}
          </button>
        </div>
      </div>
    `;
  }).join("");
}

// Creator / Admin Studio
async function loadAdminStudio() {
  const tableBody = document.getElementById("adminCoursesTableBody");
  const totalRevEl = document.getElementById("adminTotalRevenue");
  const totalStudentsEl = document.getElementById("adminTotalStudents");
  const totalCoursesEl = document.getElementById("adminTotalCourses");
  const avgRatingEl = document.getElementById("adminAvgRating");

  if (!state.token || state.role !== "admin") {
    showToast("Admin authorization required.", "error");
    openAuthModal("signin", "admin");
    return;
  }

  try {
    const [coursesRes, analyticsRes] = await Promise.all([
      api.getAdminCourses(),
      api.getAdminAnalytics()
    ]);

    if (analyticsRes.success && analyticsRes.analytics) {
      const a = analyticsRes.analytics;
      if (totalRevEl) totalRevEl.textContent = `$${(a.totalRevenue || 24850).toLocaleString()}`;
      if (totalStudentsEl) totalStudentsEl.textContent = `${(a.totalStudents || 1250).toLocaleString()}+`;
      if (totalCoursesEl) totalCoursesEl.textContent = a.totalCourses || 6;
      if (avgRatingEl) avgRatingEl.textContent = a.averageRating || "4.9 ⭐";
    }

    if (coursesRes.success && tableBody) {
      const courses = coursesRes.courses || [];
      if (courses.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 40px;">No courses created yet. Click "Create New Course" above.</td></tr>`;
        return;
      }

      tableBody.innerHTML = courses.map(c => `
        <tr>
          <td>
            <div class="table-course-cell">
              <img class="table-course-thumb" src="${c.imageUrl}" alt="${c.title}">
              <div>
                <strong>${c.title}</strong>
                <div style="font-size: 0.75rem; color: var(--text-muted);">${c.duration || '30h'} • ${c.level || 'All Levels'}</div>
              </div>
            </div>
          </td>
          <td><span class="badge badge-primary">${c.category || 'Tech'}</span></td>
          <td><strong>$${c.price}</strong></td>
          <td>${c.enrolledCount || 120} Students</td>
          <td><i class="fa-solid fa-star" style="color: #fbbf24;"></i> ${c.rating || 4.9}</td>
          <td>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-secondary btn-sm" onclick="editCourseModal('${c._id || c.id}')" title="Edit Course"><i class="fa-solid fa-pen"></i></button>
              <button class="btn btn-danger btn-sm" onclick="deleteCourse('${c._id || c.id}')" title="Delete Course"><i class="fa-solid fa-trash"></i></button>
            </div>
          </td>
        </tr>
      `).join("");
    }
  } catch (err) {
    console.error("Admin studio error:", err);
    showToast("Failed to load admin studio", "error");
  }
}

// Create / Edit Course Modal
function openCreateCourseModal() {
  editingCourseId = null;
  const form = document.getElementById("courseBuilderForm");
  const modalTitle = document.getElementById("courseBuilderModalTitle");
  if (form) form.reset();
  if (modalTitle) modalTitle.textContent = "Publish a New Tech Masterclass";
  
  // Default curriculum block
  const currContainer = document.getElementById("curriculumBuilderContainer");
  if (currContainer) {
    currContainer.innerHTML = `
      <div class="form-group" style="background: var(--bg-tertiary); padding: 14px; border-radius: var(--radius-md);">
        <label>Module 1 Title</label>
        <input type="text" class="module-title-input" value="Module 1: Architecture & Setup" required>
        <div style="margin-top: 10px;">
          <label style="font-size: 0.8rem;">Lesson Title</label>
          <input type="text" class="lesson-title-input" value="Welcome & Getting Started" required>
        </div>
      </div>
    `;
  }

  const modal = document.getElementById("courseBuilderModal");
  if (modal) modal.classList.add("show");
}

function editCourseModal(courseId) {
  editingCourseId = courseId;
  const course = allCourses.find(c => String(c._id || c.id) === String(courseId));
  if (!course) return;

  const modalTitle = document.getElementById("courseBuilderModalTitle");
  if (modalTitle) modalTitle.textContent = `Edit Course: ${course.title}`;

  document.getElementById("builderTitle").value = course.title || "";
  document.getElementById("builderSubtitle").value = course.subtitle || "";
  document.getElementById("builderDescription").value = course.description || "";
  document.getElementById("builderCategory").value = course.category || "Web Development";
  document.getElementById("builderLevel").value = course.level || "All Levels";
  document.getElementById("builderPrice").value = course.price || 89;
  document.getElementById("builderOriginalPrice").value = course.originalPrice || 149;
  document.getElementById("builderImageUrl").value = course.imageUrl || "";
  document.getElementById("builderDuration").value = course.duration || "30 Hours";
  document.getElementById("builderHighlights").value = (course.highlights || []).join("\n");

  const modal = document.getElementById("courseBuilderModal");
  if (modal) modal.classList.add("show");
}

async function handleSaveCourse(e) {
  e.preventDefault();
  const btn = document.getElementById("saveCourseSubmitBtn");
  if (btn) btn.disabled = true;

  const highlightsRaw = document.getElementById("builderHighlights").value;
  const highlights = highlightsRaw.split("\n").map(h => h.trim()).filter(Boolean);

  const courseData = {
    title: document.getElementById("builderTitle").value,
    subtitle: document.getElementById("builderSubtitle").value,
    description: document.getElementById("builderDescription").value,
    category: document.getElementById("builderCategory").value,
    level: document.getElementById("builderLevel").value,
    price: Number(document.getElementById("builderPrice").value),
    originalPrice: Number(document.getElementById("builderOriginalPrice").value),
    imageUrl: document.getElementById("builderImageUrl").value,
    duration: document.getElementById("builderDuration").value,
    highlights
  };

  try {
    if (editingCourseId) {
      const res = await api.updateCourse(editingCourseId, courseData);
      if (res.success) {
        showToast("Course updated successfully!", "success");
        closeModal("courseBuilderModal");
        await loadCourses();
        await loadAdminStudio();
      }
    } else {
      const res = await api.createCourse(courseData);
      if (res.success) {
        showToast("🎉 New Course Published Successfully!", "success");
        closeModal("courseBuilderModal");
        await loadCourses();
        await loadAdminStudio();
      }
    }
  } catch (err) {
    showToast(err.message || "Failed to save course", "error");
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function deleteCourse(courseId) {
  if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) return;

  try {
    const res = await api.deleteCourse(courseId);
    if (res.success) {
      showToast("Course removed from catalog", "success");
      await loadCourses();
      await loadAdminStudio();
    }
  } catch (err) {
    showToast("Failed to delete course", "error");
  }
}

// Modal Helpers
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove("show");
}

function openAuthModal(mode = "signin", role = "user") {
  const modal = document.getElementById("authModal");
  if (!modal) return;

  setAuthTab(mode);
  setRoleTab(role);
  modal.classList.add("show");
}

let currentAuthMode = "signin";
let currentAuthRole = "user";

function setAuthTab(mode) {
  currentAuthMode = mode;
  document.querySelectorAll(".auth-mode-tab-btn").forEach(b => b.classList.remove("active"));
  const btn = document.querySelector(`.auth-mode-tab-btn[data-mode="${mode}"]`);
  if (btn) btn.classList.add("active");

  const title = document.getElementById("authModalTitle");
  const submitBtn = document.getElementById("authSubmitBtn");
  const signupFields = document.getElementById("signupFieldsContainer");

  if (mode === "signin") {
    if (title) title.textContent = currentAuthRole === "admin" ? "Admin / Instructor Sign In" : "Student Sign In";
    if (submitBtn) submitBtn.textContent = "Sign In to Account";
    if (signupFields) signupFields.style.display = "none";
  } else {
    if (title) title.textContent = currentAuthRole === "admin" ? "Create Instructor Account" : "Create Student Account";
    if (submitBtn) submitBtn.textContent = "Create Free Account";
    if (signupFields) signupFields.style.display = "block";
  }
}

function setRoleTab(role) {
  currentAuthRole = role;
  document.querySelectorAll(".role-tab-btn").forEach(b => b.classList.remove("active"));
  const btn = document.querySelector(`.role-tab-btn[data-role="${role}"]`);
  if (btn) btn.classList.add("active");
  setAuthTab(currentAuthMode);
}

// 1-Click Demo Logins
async function fillDemoStudent() {
  document.getElementById("authEmail").value = "student@demo.com";
  document.getElementById("authPassword").value = "password123";
  setRoleTab("user");
  setAuthTab("signin");
  await submitAuthForm();
}

async function fillDemoAdmin() {
  document.getElementById("authEmail").value = "admin@demo.com";
  document.getElementById("authPassword").value = "password123";
  setRoleTab("admin");
  setAuthTab("signin");
  await submitAuthForm();
}

async function submitAuthForm(e) {
  if (e) e.preventDefault();
  const email = document.getElementById("authEmail").value;
  const password = document.getElementById("authPassword").value;
  const firstName = document.getElementById("authFirstName")?.value || "";
  const lastName = document.getElementById("authLastName")?.value || "";

  const submitBtn = document.getElementById("authSubmitBtn");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...`;
  }

  try {
    let res = null;
    if (currentAuthMode === "signin") {
      if (currentAuthRole === "admin") {
        res = await api.loginAdmin(email, password);
      } else {
        res = await api.loginUser(email, password);
      }
    } else {
      if (currentAuthRole === "admin") {
        res = await api.signupAdmin({ email, password, firstName, lastName });
      } else {
        res = await api.signupUser({ email, password, firstName, lastName });
      }
    }

    if (res.success) {
      showToast(res.message, "success");
      closeModal("authModal");
      updateAuthUI();
      if (currentAuthRole === "admin") {
        showView("view-admin");
      } else {
        await loadUserPurchases();
        showView("view-home");
      }
    }
  } catch (err) {
    showToast(err.message || "Authentication failed", "error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = currentAuthMode === "signin" ? "Sign In to Account" : "Create Free Account";
    }
  }
}

function handleLogout() {
  api.logout();
  userPurchases = [];
  updateAuthUI();
  showToast("You have been signed out safely.", "success");
  showView("view-home");
}

function toggleUserDropdown() {
  const dd = document.getElementById("userDropdownMenu");
  if (dd) dd.classList.toggle("show");
}

// Global Event Listeners
function initEventListeners() {
  // Search input debounce
  let searchTimeout = null;
  const searchInput = document.getElementById("courseSearchInput");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        loadCourses();
      }, 300);
    });
  }

  // Sort & Level selects
  document.getElementById("courseSortSelect")?.addEventListener("change", loadCourses);
  document.getElementById("courseLevelSelect")?.addEventListener("change", loadCourses);

  // Close dropdowns on outside click
  window.addEventListener("click", (e) => {
    if (!e.target.closest(".user-menu")) {
      const dd = document.getElementById("userDropdownMenu");
      if (dd) dd.classList.remove("show");
    }
  });

  // Auth Form Submit
  document.getElementById("authForm")?.addEventListener("submit", submitAuthForm);

  // Course Builder Form Submit
  document.getElementById("courseBuilderForm")?.addEventListener("submit", handleSaveCourse);
}

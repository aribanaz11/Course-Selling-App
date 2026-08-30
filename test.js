/**
 * AUTOMATED END-TO-END API TEST SUITE FOR LUMINA LEARN
 * Run with: npm test (or node test.js)
 */

const http = require("http");
const { app, startServer } = require("./index");

async function makeRequest(baseUrl, endpoint, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${baseUrl}${endpoint}`);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || "GET",
      headers: options.headers || {}
    };

    if (body) {
      reqOptions.headers["Content-Type"] = "application/json";
    }

    const req = http.request(reqOptions, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, text: data });
        }
      });
    });

    req.on("error", reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTestSuite() {
  const TEST_PORT = 30099;
  let serverInstance = null;
  const baseUrl = `http://localhost:${TEST_PORT}`;

  console.log("===============================================================");
  console.log(" 🧪 Lumina Learn Automated Integration Test Suite");
  console.log("===============================================================\n");

  try {
    // Start isolated test server
    serverInstance = await startServer(TEST_PORT);
    console.log(` ⚡ Test runner connected on ${baseUrl}\n`);
  } catch (e) {
    console.error("Failed to start test server:", e);
    process.exit(1);
  }

  let passed = 0;
  let failed = 0;

  function assert(name, condition, extraInfo = "") {
    if (condition) {
      console.log(` \x1b[32m✔ PASS\x1b[0m: ${name}`);
      passed++;
    } else {
      console.error(` \x1b[31m✖ FAIL\x1b[0m: ${name} ${extraInfo}`);
      failed++;
    }
  }

  try {
    // 1. Health Check Endpoint
    const health = await makeRequest(baseUrl, "/api/health");
    assert("Health Check returns 200 OK & healthy status", health.status === 200 && health.data.status === "healthy");

    // 2. Course Catalog Preview
    const preview = await makeRequest(baseUrl, "/api/v1/course/preview");
    assert("Course Preview endpoint returns courses array", preview.status === 200 && Array.isArray(preview.data.courses) && preview.data.courses.length > 0);

    // 3. Course Categories Grouping
    const categories = await makeRequest(baseUrl, "/api/v1/course/categories");
    assert("Course Categories endpoint returns grouped list", categories.status === 200 && Array.isArray(categories.data.categories) && categories.data.categories.length > 0);

    // 4. Student Signin (Demo User)
    const userSignin = await makeRequest(baseUrl, "/api/v1/user/signin", { method: "POST" }, {
      email: "student@demo.com",
      password: "password123"
    });
    assert("Demo Student signin authenticates & returns JWT", userSignin.status === 200 && !!userSignin.data.token);
    const userToken = userSignin.data.token;

    // 5. User Profile Route (Protected)
    const userProfile = await makeRequest(baseUrl, "/api/v1/user/profile", {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert("User Profile endpoint returns authenticated student data", userProfile.status === 200 && userProfile.data.user.email === "student@demo.com");

    // 6. User Enrolled Courses
    const userPurchases = await makeRequest(baseUrl, "/api/v1/user/purchases", {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert("User Purchases endpoint returns list of enrolled courses", userPurchases.status === 200 && Array.isArray(userPurchases.data.purchases));

    // 7. Admin Signin (Demo Admin)
    const adminSignin = await makeRequest(baseUrl, "/api/v1/admin/signin", { method: "POST" }, {
      email: "admin@demo.com",
      password: "password123"
    });
    assert("Demo Admin signin authenticates & returns JWT", adminSignin.status === 200 && !!adminSignin.data.token);
    const adminToken = adminSignin.data.token;

    // 8. Admin Creator Studio Analytics
    const adminAnalytics = await makeRequest(baseUrl, "/api/v1/admin/analytics", {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert("Admin Analytics endpoint calculates platform metrics", adminAnalytics.status === 200 && adminAnalytics.data.analytics.totalRevenue > 0);

    // 9. Admin Bulk Courses Management
    const adminCourses = await makeRequest(baseUrl, "/api/v1/admin/course/bulk", {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert("Admin Bulk Courses endpoint returns all courses", adminCourses.status === 200 && adminCourses.data.count > 0);

    // 10. Admin Create Course
    const newCourseRes = await makeRequest(baseUrl, "/api/v1/admin/course", {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` }
    }, {
      title: "Kubernetes & Cloud Native Architecture",
      subtitle: "Master container orchestration and high-availability microservices.",
      description: "Comprehensive hands-on course building enterprise clusters on AWS EKS and Google Cloud GKE.",
      price: 99,
      originalPrice: 199,
      category: "Cloud & DevOps"
    });
    assert("Admin can create & publish a new course", newCourseRes.status === 201 && !!newCourseRes.data.courseId);
    const createdCourseId = newCourseRes.data.courseId;

    // 11. Student Enroll & Purchase Course
    const purchaseRes = await makeRequest(baseUrl, "/api/v1/course/purchase", {
      method: "POST",
      headers: { Authorization: `Bearer ${userToken}` }
    }, {
      courseId: createdCourseId
    });
    assert("Student can successfully purchase and enroll in course", purchaseRes.status === 201 && purchaseRes.data.success === true);

    // 12. Student Post Course Review
    const reviewRes = await makeRequest(baseUrl, `/api/v1/course/${createdCourseId}/review`, {
      method: "POST",
      headers: { Authorization: `Bearer ${userToken}` }
    }, {
      rating: 5,
      comment: "Spectacular explanations! One of the clearest DevOps tutorials I've experienced."
    });
    assert("Student can post a rating and review on the course", reviewRes.status === 201 && reviewRes.data.success === true);

    // 13. Student Update Lesson Progress
    const progressRes = await makeRequest(baseUrl, "/api/v1/user/progress", {
      method: "POST",
      headers: { Authorization: `Bearer ${userToken}` }
    }, {
      courseId: createdCourseId,
      lessonId: "les_1_1"
    });
    assert("Student can mark lessons complete and update progress", progressRes.status === 200 && progressRes.data.success === true);

  } catch (err) {
    console.error("Test execution caught an unexpected error:", err);
    failed++;
  } finally {
    if (serverInstance && serverInstance.close) {
      serverInstance.close();
    }
  }

  console.log("\n===============================================================");
  console.log(` 🏁 Test Suite Completed: \x1b[32m${passed} Passed\x1b[0m, \x1b[31m${failed} Failed\x1b[0m`);
  console.log("===============================================================\n");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite();

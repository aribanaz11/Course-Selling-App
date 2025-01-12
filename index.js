const express = require("express");
const { userRouter } = require("./routes/user");
const { CourseRoutes, courseRouter } = require("./routes/course");
const { adminRouter } = require("./routes/admin");
const app = express();

app.use("/api/v1/user", userRouter);
app.use("/api/v1/course", courseRouter);
app.use("/api/v1/admin", adminRouter);

app.listen(30001, () => {
    console.log(' App is started at 30001');
 })
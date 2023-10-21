const teacherCourseSchema = new mongoose.Schema({
    teacherCode: {
        type: String,
        required: true
    },
    courseCode: {
        type: String,
        required: true
    }
});
const TeacherCourse = mongoose.model('TeacherCourse', teacherCourseSchema);
 
app.post("/TeacherCourse", async (req, resp) => {
    try {
        const teacherCourse = new TeacherCourse(req.body);
        let result = await teacherCourse.save();
        result = result.toObject();
        if (result) {
            resp.send(req.body);
            console.log(result);
        } else {
            console.log("teacherCourse already registered");
        }
 
    } catch (e) {
        resp.status(400).send("!!! Error in teacherCourse register panel !!!\n" + e);
    }
});

app.get("/TeacherCourse", async (req, resp) => {
    try {
        // Retrieve all TeacherCourse from the MongoDB database
        const users = await TeacherCourse.find({});
        resp.json(users); // Send the users as a JSON response
    } catch (error) {
        console.error("An error occurred in TeacherCourse get function:", error);
        resp.status(500).send("Internal Server Error");
    }
});
// For backend and express
const express = require('express');
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;

require('dotenv').config();
app.use(express.json());
app.use(cors());
app.get("/", (req, resp) => {
    resp.send("App is Working");
});

// Connect to the database
const mongoose = require('mongoose');
mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.smd1bmx.mongodb.net/?retryWrites=true&w=majority`, {
    dbName: 'routine',
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('Connected to routine database');
})
.catch(err => {
    console.error('Error connecting to the database:', err);
});

// Schema for teachers of app
const teacherSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    teacherCode: {
        type: String,
        required: true,
        unique: true
    },
    courses: {
        type: Array,
        required: false,
        default: []
    },
    date: {
        type: Date,
        default: Date.now,
    },
});
const Teacher = mongoose.model('teachers', teacherSchema);
 
app.post("/teachers", async (req, resp) => {
    try {
        const teacher = new Teacher(req.body);
        let result = await teacher.save();
        result = result.toObject();
        if (result) {
            delete result.password;
            resp.send(req.body);
            console.log(result);
        } else {
            console.log("teacher already registered");
        }
 
    } catch (e) {
        resp.status(400).send("!!! Error in teacher register panel !!!\n" + e);
    }
});

app.get("/teachers", async (req, resp) => {
    try {
        // Retrieve all teachers from the MongoDB database
        const users = await Teacher.find({});
        resp.json(users); // Send the users as a JSON response
    } catch (error) {
        console.error("An error occurred in teachers get function:", error);
        resp.status(500).send("Internal Server Error");
    }
});

// to update courses of a teacher
app.put("/teachers/:teacherCode/courses", async (req, resp) => {
    try {
        const teacherCode = req.params.teacherCode;
        const coursesToUpdate = req.body.courses; // Assuming you send an array of courses in the request body

        // Find the teacher by ID
        const teacher = await Teacher.findOne({ teacherCode });

        if (!teacher) {
            return resp.status(404).send("Teacher not found");
        }

        // Update the courses field
        teacher.courses = coursesToUpdate;

        // Save the updated teacher
        const updatedTeacher = await teacher.save();

        resp.json(updatedTeacher);
    } catch (error) {
        console.error("An error occurred in updating teacher courses:", error);
        resp.status(500).send("Internal Server Error");
    }
});


// course details
const courseDetailsSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    term: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now,
    },
});
const CourseDetails = mongoose.model('courseDetails', courseDetailsSchema);
 
app.post("/courseDetails", async (req, resp) => {
    try {
        const courseDetails = new CourseDetails(req.body);
        let result = await courseDetails.save();
        result = result.toObject();
        if (result) {
            resp.send(req.body);
            console.log(result);
        } else {
            console.log("courseDetails already registered");
        }
 
    } catch (e) {
        resp.status(400).send("!!! Error in courseDetails register panel !!!\n" + e);
    }
});

app.get("/courseDetails", async (req, resp) => {
    try {
        // Retrieve all CourseDetails from the MongoDB database
        const users = await CourseDetails.find({});
        resp.json(users); // Send the users as a JSON response
    } catch (error) {
        console.error("An error occurred in CourseDetails get function:", error);
        resp.status(500).send("Internal Server Error");
    }
});

// Schema for students of app
const studentSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    year: {
        type: Number,
        required: true,
    },
    term: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now,
    },
});
const Student = mongoose.model('students', studentSchema);
 
app.post("/students", async (req, resp) => {
    try {
        const student = new Student(req.body);
        let result = await student.save();
        result = result.toObject();
        if (result) {
            delete result.password;
            resp.send(req.body);
            console.log(result);
        } else {
            console.log("student already register");
        }
 
    } catch (e) {
        resp.send("!!! Error in student register panel !!!\n", e);
    }
});

app.get("/students", async (req, resp) => {
    try {
        // Retrieve all students from the MongoDB database
        const users = await Student.find({});
        resp.json(users); // Send the users as a JSON response
    } catch (error) {
        console.error("An error occurred in students get function:", error);
        resp.status(500).send("Internal Server Error");
    }
});

// create database for time-slot
const timeSlotSchema = new mongoose.Schema({
    timeSlot: Array
});

const TimeSlot = mongoose.model('timeSlot', timeSlotSchema);

const createTimeSlot = async () => {
    try {
        const newTimeSlot = new TimeSlot({
            timeSlot: [
                {
                    start: '9:00',
                    end: '9:45'
                },
                {
                    start: '9:50',
                    end: '10:35'
                },
                {
                    start: '10:40',
                    end: '11:25'
                },
                {
                    start: '11:30',
                    end: '12:15'
                },
                {
                    start: '12:15',
                    end: '1:00'
                },
                {
                    start: '2:00',
                    end: '2:50'
                },
                {
                    start: '2:55',
                    end: '3:45'
                },
            ]
        });

        const timeSlot = await newTimeSlot.save();
        console.log('Time-slot saved:', timeSlot);
    } catch (err) {
        console.error('Error saving time-slot:', err);
    }
};
// createTimeSlot();

// get time-slot
app.get("/timeSlot", async (req, resp) => {
    try {
        const timeSlot = await TimeSlot.find({});
        resp.json(timeSlot); // Send the users as a JSON response
    } catch (error) {
        console.error("An error occurred in time-slot get function:", error);
        resp.status(500).send("Internal Server Error");
    }
});

// create database for room
const roomSchema = new mongoose.Schema({
    class: Array,
    lab: Object
});

const Room = mongoose.model('room', roomSchema);
const createRoom = async () => {
    try {
        const newRoom = new Room({
            class: ['809', '810'],
            lab: {
                computer: ['808', '812'],
                electrical: '813'
            }
        });

        const room = await newRoom.save();
        console.log('Room saved:', room);
    } catch (err) {
        console.error('Error saving room:', err);
    }
};
// createRoom();

// get room
app.get("/room", async (req, resp) => {
    try {
        const room = await Room.find({});
        resp.json(room); // Send the users as a JSON response
    } catch (error) {
        console.error("An error occurred in room get function:", error);
        resp.status(500).send("Internal Server Error");
    }
});

// create routine randomly


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
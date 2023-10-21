const express = require('express');
const app = express();
const cors = require("cors");
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');
const port = process.env.PORT || 6000;

app.use(bodyParser.json());
app.use(cors());

// Connect to the MongoDB database
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.smd1bmx.mongodb.net/routine`;
const client = new MongoClient(uri, { useUnifiedTopology: true });

async function connectToDatabase() {
  try {
    await client.connect();
    console.log('Connected to routine database');
  } catch (error) {
    console.error('Error connecting to the database:', error);
  }
}

connectToDatabase();

app.get("/", (req, resp) => {
  resp.send("App is Working");
});

// Schema for teachers of app
const teacherCollection = client.db('routine').collection('teachers');

app.post("/teachers", async (req, resp) => {
  try {
    const teacher = req.body;
    const result = await teacherCollection.insertOne(teacher);
    if (result) {
      delete teacher.password;
      resp.send(req.body);
      console.log(teacher);
    } else {
      console.log("teacher already registered");
    }
  } catch (e) {
    resp.status(400).send("!!! Error in teacher register panel !!!\n" + e);
  }
});

app.get("/teachers", async (req, resp) => {
  try {
    const teachers = await teacherCollection.find({}).toArray();
    resp.json(teachers);
  } catch (error) {
    console.error("An error occurred in teachers get function:", error);
    resp.status(500).send("Internal Server Error");
  }
});

// Schema for course details
const courseDetailsCollection = client.db('routine').collection('courseDetails');

app.post("/courseDetails", async (req, resp) => {
  try {
    const courseDetails = req.body;
    const result = await courseDetailsCollection.insertOne(courseDetails);
    if (result) {
      resp.send(req.body);
      console.log(courseDetails);
    } else {
      console.log("courseDetails already registered");
    }
  } catch (e) {
    resp.status(400).send("!!! Error in courseDetails register panel !!!\n" + e);
  }
});

app.get("/courseDetails", async (req, resp) => {
  try {
    const courseDetails = await courseDetailsCollection.find({}).toArray();
    resp.json(courseDetails);
  } catch (error) {
    console.error("An error occurred in courseDetails get function:", error);
    resp.status(500).send("Internal Server Error");
  }
});

// Schema for teacher course database
const teacherCourseCollection = client.db('routine').collection('teacherCourse');

app.post("/teacherCourse", async (req, resp) => {
  try {
    const teacherCourse = req.body;
    const result = await teacherCourseCollection.insertOne(teacherCourse);
    if (result) {
      resp.send(req.body);
      console.log(teacherCourse);
    } else {
      console.log("teacherCourse already registered");
    }
  } catch (e) {
    resp.status(400).send("!!! Error in teacherCourse register panel !!!\n" + e);
  }
});

app.get("/teacherCourse", async (req, resp) => {
  try {
    const teacherCourses = await teacherCourseCollection.find({}).toArray();
    resp.json(teacherCourses);
  } catch (error) {
    console.error("An error occurred in teacherCourse get function:", error);
    resp.status(500).send("Internal Server Error");
  }
});

// Schema for students of app
const studentCollection = client.db('routine').collection('students');

app.post("/students", async (req, resp) => {
  try {
    const student = req.body;
    const result = await studentCollection.insertOne(student);
    if (result) {
      delete student.password;
      resp.send(req.body);
      console.log(student);
    } else {
      console.log("student already registered");
    }
  } catch (e) {
    resp.status(400).send("!!! Error in student register panel !!!\n" + e);
  }
});

app.get("/students", async (req, resp) => {
  try {
    const students = await studentCollection.find({}).toArray();
    resp.json(students);
  } catch (error) {
    console.error("An error occurred in students get function:", error);
    resp.status(500).send("Internal Server Error");
  }
});

// Schema for time slots
const timeSlotCollection = client.db('routine').collection('timeSlot');

// Uncomment the following code to create the time slots initially
/*
const createTimeSlot = async () => {
  try {
    const newTimeSlot = {
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
    };

    const result = await timeSlotCollection.insertOne(newTimeSlot);
    console.log('Time-slot saved:', result);
  } catch (err) {
    console.error('Error saving time-slot:', err);
  }
};

// Uncomment the following line to create the time slots initially
// createTimeSlot();
*/

// Get time slots
app.get("/timeSlot", async (req, resp) => {
  try {
    const timeSlot = await timeSlotCollection.findOne({});
    resp.json(timeSlot); // Send the time slots as a JSON response
  } catch (error) {
    console.error("An error occurred in time-slot get function:", error);
    resp.status(500).send("Internal Server Error");
  }
});

// Schema for room
const roomCollection = client.db('routine').collection('room');

// Uncomment the following code to create the room initially
/*
const createRoom = async () => {
  try {
    const newRoom = {
      class: ['809', '810'],
      lab: {
        computer: ['808', '812'],
        electrical: '813'
      };
  
      const result = await roomCollection.insertOne(newRoom);
      console.log('Room saved:', result);
  } catch (err) {
    console.error('Error saving room:', err);
  }
};

// Uncomment the following line to create the room initially
// createRoom();
*/

// Get room
app.get("/room", async (req, resp) => {
  try {
    const room = await roomCollection.find({}).toArray();
    resp.json(room);
  } catch (error) {
    console.error("An error occurred in room get function:", error);
    resp.status(500).send("Internal Server Error");
  }
});


// Continue with similar changes for other collections (teacherCourse, students, timeSlot, and room)

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

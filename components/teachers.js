const express = require('express');
const app = express.Router();
const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        default: ""
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    mobile: {
        type: String
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
    designation: {
        type: String,
        required: true
    },
    department: {
        type: String,
        default: "ICE, NSTU"
    },
    password: {
        type: String,
        required: true
    },
    joiningDate: {
        type: Date,
        default: Date.now,
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    isInExamCommittee: {
        type: Boolean,
        default: false
    },
    isInRoutineCommittee: {
        type: Boolean,
        default: false
    }
});
const Teacher = mongoose.model('teachers', teacherSchema);
 
app.post("/", async (req, resp) => {
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

app.get("/", async (req, resp) => {
    try {
        // Retrieve all teachers from the MongoDB database
        const users = await Teacher.find({});
        resp.json(users); // Send the users as a JSON response
    } catch (error) {
        console.error("An error occurred in teachers get function:", error);
        resp.status(500).send("Internal Server Error");
    }
});

app.get('/by-email/:email', async (req, res) => {
    const email = req.params.email;
  
    try {
      const teacher = await Teacher.findOne({ email });
  
      if (!teacher) {
        return res.status(404).json({ error: 'Teacher not found' });
      }
  
      res.json(teacher);
    } catch (error) {
      console.error('Error fetching teacher details:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Update a teacher by email
app.put('/updateTeacher', async (req, res) => {
    const { email, newData } = req.body;
  
    try {
      // Find the teacher by email and update
      const updatedTeacher = await Teacher.findOneAndUpdate(
        { email },
        newData,
        { new: true } // Return the updated document
      );
  
      if (!updatedTeacher) {
        return res.status(404).json({ message: 'Teacher not found' });
      }
  
      res.json(updatedTeacher);
    } catch (error) {
      console.error('Error updating teacher:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
});

// to update courses of a teacher
app.put("/:teacherCode/courses", async (req, resp) => {
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


module.exports = app;
const express = require('express');
const app = express.Router();
const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
    firstName: {
        type: String
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
        type: String
    },
    department: {
        type: String,
        default: "ICE, NSTU"
    },
    password: {
        type: String,
        required: true,
        default: "Ha Ha Ha"
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
 
app.post("/", async (req, res) => {
    try {
        const teacher = new Teacher(req.body);
        let result = await teacher.save();
        result = result.toObject();
        if (result) {
            delete result.password;
            res.send({ success: true, data: result });
            // console.log(result);
        } else {
            res.send({ success: false, error: 'This gmail account is already registered!' });
            console.log("teacher already registered");
        }
 
    } catch (e) {
        console.log(e);
        res.send({ success: false, error: "Error in teacher register panel", e: e });
    }
});

app.get("/", async (req, res) => {
    try {
        // Retrieve all teachers from the MongoDB database
        const users = await Teacher.find({});
        res.json({ success: true, data: users }); // Send the users as a JSON response
    } catch (error) {
        console.error("An error occurred in teachers get function:", error);
        res.send({ success: false, error: "Internal Server Error" });
    }
});

app.get('/by-email/:email', async (req, res) => {
    const email = req.params.email;
  
    try {
      const teacher = await Teacher.findOne({ email });
  
      if (!teacher) {
        return res.json({ success: false, error: 'Your provided email address has no teacher profile!' });
      }
  
      res.json({ success: true, data: teacher });
    } catch (error) {
      console.error('Error fetching teacher details:', error);
      res.json({ success: false, error: 'Internal Server Error! Try again.' });
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
        return res.json({ success: false, error: 'Your provided email address has no teacher profile!' });
      }
  
      res.json({ success: true, data: updatedTeacher });
    } catch (error) {
      console.error('Error updating teacher:', error);
      res.json({ success: false, error: 'Internal Server Error' });
    }
});

// Update an external teacher by email
app.put('/updateExternalTeacher', async (req, res) => {
    const { email, newData } = req.body;
  
    try {
        if (newData.department === "ICE, NSTU") {
            console.log("The teacher is not an external teacher!");
            return res.json({ success: false, error: "The teacher is not an external teacher!" });
        }
        
        // Find the teacher by email and update
        const updatedTeacher = await Teacher.findOneAndUpdate(
            { email },
            newData,
            { new: true } // Return the updated document
        );
  
        if (!updatedTeacher) {
            console.log('Your provided email address has no teacher profile!');
            return res.json({ success: false, error: 'Your provided email address has no teacher profile!' });
        }
  
        res.json({ success: true, data: updatedTeacher });
    } catch (error) {
        console.error('Error updating teacher:', error.message);
        res.json({ success: false, error: error.message || 'Internal Server Error' });
    }
});

// to update courses of a teacher
app.put("/:teacherCode/courses", async (req, res) => {
    try {
        const teacherCode = req.params.teacherCode;
        const coursesToUpdate = req.body.courses; // Assuming you send an array of courses in the request body

        // Find the teacher by ID
        const teacher = await Teacher.findOne({ teacherCode });

        if (!teacher) {
            return res.send({ success: false, error: "Your provided teacher code is not registered yet! " });
        }

        // Update the courses field
        teacher.courses = coursesToUpdate;

        // Save the updated teacher
        const updatedTeacher = await teacher.save();

        res.json({ success: true, data: updatedTeacher });
    } catch (error) {
        console.error("An error occurred in updating teacher courses:", error);
        res.send({ success: false, error: "Internal Server Error" });
    }
});

// delete an external teacher by id
app.delete('/deleteExternalTeacher/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Find the teacher by ID
        const teacher = await Teacher.findById(id);

        if (!teacher) {
            return res.json({ success: false, error: "Teacher not found!" });
        }

        // Check if the teacher's department is "ICE, NSTU"
        if (teacher.department === "ICE, NSTU") {
            return res.json({ success: false, error: "Cannot delete a teacher from the ICE department!" });
        }

        // Delete the teacher
        await Teacher.findByIdAndDelete(id);

        res.json({ success: true, message: "Teacher deleted successfully!" });
    } catch (error) {
        console.error("Error deleting teacher:", error);
        res.json({ success: false, error: "Internal Server Error" });
    }
});



module.exports = app;
const express = require('express');
const app = express.Router();
const mongoose = require('mongoose');

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
    ID: {
        type: String,
        required: true
    },
    Session: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now,
    },
});
const Student = mongoose.model('students', studentSchema);

app.post("/", async (req, res) => {
  try {
    // Check if a student with the provided email already exists
    const existingStudent = await Student.findOne({ email: req.body.email });

    if (existingStudent) {
      // If a student with the same email already exists, return a conflict response (HTTP 409).
      return res.status(409).json({ error: "Student already registered with this email" });
    }

    // Create a new student using the data from the request body
    const newStudent = new Student(req.body);

    // Save the new student to the database
    await newStudent.save();

    // Respond with a success message and the saved student data
    const savedStudent = newStudent.toObject();
    delete savedStudent.password; // Remove sensitive data from the response

    res.status(201).json(savedStudent);
  } catch (error) {
    console.error("Error in student registration:", error);
    res.status(500).json({ error: "An error occurred while registering the student" });
  }
});


app.get("/", async (req, resp) => {
    try {
        // Retrieve all students from the MongoDB database
        const users = await Student.find({});
        resp.json(users); // Send the users as a JSON response
    } catch (error) {
        console.error("An error occurred in students get function:", error);
        resp.status(500).send("Internal Server Error");
    }
});

module.exports = app;

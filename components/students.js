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
    date: {
        type: Date,
        default: Date.now,
    },
});
const Student = mongoose.model('students', studentSchema);
 
app.post("/", async (req, resp) => {
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

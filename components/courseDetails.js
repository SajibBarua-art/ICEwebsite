const express = require('express');
const app = express.Router();
const mongoose = require('mongoose');

const courseDetailsSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    credit: {
        type: Number,
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

app.post("/", async (req, res) => {
    try {
        const courseDetails = new CourseDetails(req.body);
        let result = await courseDetails.save();
        result = result.toObject();
        if (result) {
            res.send( { success: true, data: result });
        } else {
            res.send({ success: false, error: 'Your provided course code is already registered!' });
            console.log("This course details already registered");
        }

    } catch (e) {
        res.send({ success: false, error: "Internal Server Error!" });
    }
});

app.get("/", async (req, res) => {
    try {
        // Retrieve all CourseDetails from the MongoDB database
        const users = await CourseDetails.find({});
        res.json({ success: true, data: users }); // Send the users as a JSON response
    } catch (error) {
        console.error("An error occurred in CourseDetails get function:", error);
        res.send({ success: false, error: "Internal Server Error" });
    }
});

module.exports = app;
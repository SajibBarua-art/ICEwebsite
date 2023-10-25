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
 
app.post("/", async (req, resp) => {
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

app.get("/", async (req, resp) => {
    try {
        // Retrieve all CourseDetails from the MongoDB database
        const users = await CourseDetails.find({});
        resp.json(users); // Send the users as a JSON response
    } catch (error) {
        console.error("An error occurred in CourseDetails get function:", error);
        resp.status(500).send("Internal Server Error");
    }
});

module.exports = app;
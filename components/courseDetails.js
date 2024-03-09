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
        let results = await CourseDetails.find({});
        if (results) {
            results = results.map(doc => doc.toObject()); // Convert documents to objects if necessary
            // Sort the results based on the part of the code after the dash
            results.sort((a, b) => {
                const aa = a.code.split('-'), bb = b.code.split('-');
                const lastA = aa[1], lastB = bb[1];
                return lastA.localeCompare(lastB);
            });
            res.send({ success: true, data: results });
        } else {
            res.send({ success: false, error: 'No course details found!' });
        }
    } catch (e) {
        console.error(e);
        res.send({ success: false, error: "Internal Server Error!" });
    }
});

module.exports = app;
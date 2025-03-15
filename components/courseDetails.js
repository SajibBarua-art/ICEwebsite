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
                let lastA = aa[1], lastB = bb[1];
                
                if(aa[0] != bb[0] && a.year === b.year && a.term === b.term) {
                    if(aa[0] === "ICE") return -1;
                    if(bb[0] === "ICE") return 1;
                }

                if(!lastA || !lastB) {
                    const yearTermA = `${a.year}${a.term}`;
                    const yearTermB = `${b.year}${b.term}`;

                    // console.log(yearTermA, " ", yearTermB);

                    return yearTermA.localeCompare(yearTermB);
                }
                
                // console.log("lastA: ", lastA, " lastB: ", lastB, "aa: ", aa, "bb: ", bb);
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

// Route to delete a course
app.delete('/delete/:id', async(req, res) => {
    const { id } = req.params;

    try {
        // Delete data that matches the service name
        const result = await CourseDetails.deleteOne({ _id: id });

        if (result.deletedCount > 0) {
            res.json({ success: true });
        } else {
            res.status(404).json({ success: false, error: 'No matching objects found for deletion.' });
        }
    } catch (error) {
        console.error("Error occurred while deleting objects:", error);
        res.status(500).json({ success: false, error: "An error occurred while deleting objects." });
    }
});

// Route to update a course
app.put('/update/:id', async (req, res) => {
    const { id } = req.params;
    const updatedCourseData = req.body;

    console.log("Updating course:", id, updatedCourseData);

    try {
        // Find and update the course by ID, ensuring validators run (including unique constraint)
        const course = await CourseDetails.findByIdAndUpdate(
        id,
        { $set: updatedCourseData },
        { new: true, runValidators: true } // Returns the updated document and enforces validation
        );

        if (!course) {
        return res.status(404).json({ success: false, error: 'Course not found.' });
        }

        res.json({ success: true, message: 'Course updated successfully.', data: course });
    } catch (error) {
        if (error.code === 11000) {
        // Duplicate key error (unique constraint violation)
        return res.status(400).json({
            success: false,
            error: `Duplicate entry: course ${Object.keys(error.keyValue)[0]} must be unique.`,
        });
        }

        console.error("Error occurred while updating the course:", error);
        res.status(500).json({ success: false, error: "An error occurred while updating the course." });
    }
});

module.exports = app;
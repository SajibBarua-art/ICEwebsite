const express = require('express');
const app = express.Router();
const mongoose = require('mongoose');
const TheoryDutyRoaster = mongoose.model('theorydutyroaster');

// Route to get data by MongoDB ObjectID
app.get('/data/:id', async (req, res) => {
    const id = req.params.id;

    try {
        const result = await TheoryDutyRoaster.findById(id);

        if (result) {
            res.json({ success: true, data: result });
        } else {
            res.json({ success: false, error: 'Data not found' });
        }
    } catch (error) {
        console.error("An error occurred while retrieving data:", error);
        res.send({ success: false, error: "Internal Server Error" });
    }
});

// Route to delete object by examYear and semester
app.delete('/deleteObject/:year/:semester', async (req, res) => {
    const { year, semester } = req.params;
    const yearSemester = year.toString() + semester.toString();

    try {
        // Find and delete the object
        const deletedObject = await YourModel.findOneAndDelete({ yearSemester });

        if (!deletedObject) {
            return res.json({ success: false, error: 'Object not found' });
        }

        return res.json({ success: true });
    } catch (error) {
        console.error('Error deleting object:', error);
        return res.json({ success: false, error: 'Internal server error' });
    }
});

module.exports = app;

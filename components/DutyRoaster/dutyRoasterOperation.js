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
            res.json(result);
        } else {
            res.status(404).json({ error: 'Data not found' });
        }
    } catch (error) {
        console.error("An error occurred while retrieving data:", error);
        res.status(500).send("Internal Server Error");
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
            return res.status(404).json({ error: 'Object not found' });
        }

        return res.status(200).json({ error: 'Object deleted successfully', deletedObject });
    } catch (error) {
        console.error('Error deleting object:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = app;

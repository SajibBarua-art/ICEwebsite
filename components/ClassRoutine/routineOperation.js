const express = require('express');
const app = express.Router();
const mongoose = require('mongoose');
const Routine = mongoose.model('routine');
const { getDataById, deleteDataById } = require('../CommonOperation/commonOperation');

// Route to get data by MongoDB ObjectID
app.get('/data/:id', getDataById(Routine));

// Route to delete object by examYear and semester
app.delete('/deleteObject/:year/:semester', deleteDataById(Routine));

// To update an routine allocation manually
app.put('/update/:id', async (req, res) => {
    const id = req.params.id;
    const { day, year, term, timeslot, roomNo, courseCode, teacherCode } = req.body;

    try {
        // Find the document based on the query
        let routine = await Routine.findById(id);

        // Update the routine array
        if (routine) {
            routine[day][year][term][timeslot] = {
                isAllocated: true,
                courseCode: courseCode,
                teacherCode: teacherCode,
                room: roomNo
            };

            await routine.save();

            res.json({ success: true, data: routine });
        } else {
            res.json({ success: false, error: 'Something went wrong! Try again.' });
        }
    } catch (err) {
        res.json({ success: false, error: 'Internal Server Error' });
    }
});

module.exports = app;

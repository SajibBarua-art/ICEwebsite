const express = require('express');
const app = express.Router();
const mongoose = require('mongoose');
const Routine = mongoose.model('routine');
const { getDataById, deleteDataById, updateDataById } = require('../CommonOperation/commonOperation');

// Route to get data by MongoDB ObjectID
app.get('/data/:_id', getDataById(Routine));

// Route to delete object by id
app.delete('/deleteObject/:_id', deleteDataById(Routine));

// Route to update the whole routine by id
app.put('/update/:_id', updateDataById(Routine));

// To update a routine cell allocation manually by id
app.put('/cell/update/:_id', async (req, res) => {
    const _id = req.params._id;
    const { day, year, term, timeslot, roomNo, courseCode, teacherCode } = req.body;

    try {
        // Find the document based on the query
        let routine = await Routine.findById(_id);

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

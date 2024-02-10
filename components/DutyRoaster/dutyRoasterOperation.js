const express = require('express');
const app = express.Router();
const mongoose = require('mongoose');
const { getDataById, deleteDataById, updateDataById } = require('../CommonOperation/commonOperation');
const TheoryDutyRoaster = mongoose.model('theorydutyroaster');

// Route to get data by MongoDB ObjectID
app.get('/data/:_id', getDataById(TheoryDutyRoaster));

// Route to delete object by id
app.delete('/deleteObject/:_id', deleteDataById(TheoryDutyRoaster));

// Route to update the whole theoryDutyRoaster by id
app.put('/update/:_id', updateDataById(TheoryDutyRoaster));

// To update a theoryDutyRoaster cell allocation manually by id
app.put('/cell/update/:_id', async (req, res) => {
    const _id = req.params._id;
    const { day, year, term, timeslot, roomNo, courseCode, teacherCode } = req.body;

    try {
        // Find the document based on the query
        let theoryDutyRoaster = await TheoryDutyRoaster.findById(_id);

        // Update the theoryDutyRoaster array
        if (theoryDutyRoaster) {
            theoryDutyRoaster[day][year][term][timeslot] = {
                isAllocated: true,
                courseCode: courseCode,
                teacherCode: teacherCode,
                room: roomNo
            };

            await theoryDutyRoaster.save();

            res.json({ success: true, data: theoryDutyRoaster });
        } else {
            res.json({ success: false, error: 'Something went wrong! Try again.' });
        }
    } catch (err) {
        res.json({ success: false, error: 'Internal Server Error' });
    }
});

module.exports = app;

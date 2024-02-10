const express = require('express');
const app = express.Router();
const mongoose = require('mongoose');
const ExamCommittee = mongoose.model('examcommittees');
const { getDataById, deleteDataById, updateDataById } = require('../CommonOperation/commonOperation');

// Route to get data by MongoDB ObjectID
app.get('/data/:_id', getDataById(ExamCommittee));

// Route to delete object by id
app.delete('/deleteObject/:_id', deleteDataById(ExamCommittee));

// Route to update the whole examCommittee by id
app.put('/update/:_id', updateDataById(ExamCommittee));

// To update a examCommittee cell allocation manually by id
app.put('/cell/update/:_id', async (req, res) => {
    const _id = req.params._id;
    const { day, year, term, timeslot, roomNo, courseCode, teacherCode } = req.body;

    try {
        // Find the document based on the query
        let examCommittee = await ExamCommittee.findById(_id);

        // Update the examCommittee array
        if (examCommittee) {
            examCommittee[day][year][term][timeslot] = {
                isAllocated: true,
                courseCode: courseCode,
                teacherCode: teacherCode,
                room: roomNo
            };

            await examCommittee.save();

            res.json({ success: true, data: examCommittee });
        } else {
            res.json({ success: false, error: 'Something went wrong! Try again.' });
        }
    } catch (err) {
        res.json({ success: false, error: 'Internal Server Error' });
    }
});

module.exports = app;

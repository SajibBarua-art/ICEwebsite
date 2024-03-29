const express = require('express');
const app = express.Router();
const mongoose = require('mongoose');
const LabExamCommittee = mongoose.model('labexamcommittees');
const { getDataByIdAndModel, deleteDataByIdAndModel, updateDataByIdAndModel } = require('../CommonOperation/commonOperation');

// Route to get data by MongoDB ObjectID
app.get('/data/:id/:serviceName', getDataByIdAndModel());

// Route to delete object by id
app.delete('/deleteObject/:id/:serviceName', deleteDataByIdAndModel());

// Route to update the whole labExamCommittee by id
app.put('/update/:id/:serviceName', updateDataByIdAndModel());

// To update a labExamCommittee cell allocation manually by id
app.put('/cell/update/:id', async (req, res) => {
    const _id = req.params._id;
    const { day, year, term, timeslot, roomNo, courseCode, teacherCode } = req.body;

    try {
        // Find the document based on the query
        let labExamCommittee = await LabExamCommittee.findById(_id);

        // Update the labExamCommittee array
        if (labExamCommittee) {
            labExamCommittee[day][year][term][timeslot] = {
                isAllocated: true,
                courseCode: courseCode,
                teacherCode: teacherCode,
                room: roomNo
            };

            await labExamCommittee.save();

            res.json({ success: true, data: labExamCommittee });
        } else {
            res.json({ success: false, error: 'Something went wrong! Try again.' });
        }
    } catch (err) {
        res.json({ success: false, error: 'Internal Server Error' });
    }
});

module.exports = app;

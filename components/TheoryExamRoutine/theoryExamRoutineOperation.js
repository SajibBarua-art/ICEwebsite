const express = require('express');
const app = express.Router();
const mongoose = require('mongoose');
const TheoryExamComittee = mongoose.model('TheoryExamRoutine');
const { getDataByIdAndModel, deleteDataByIdAndModel, updateDataByIdAndModel } = require('../CommonOperation/commonOperation');

// Route to get data by MongoDB ObjectID
app.get('/data/:id/:serviceName', getDataByIdAndModel());

// Route to delete object by id
app.delete('/deleteObject/:id/:serviceName', deleteDataByIdAndModel());

// Route to update the whole theoryExamComittee by id
app.put('/update/:id/:serviceName', updateDataByIdAndModel());

// To update a theoryExamComittee cell allocation manually by id
app.put('/cell/update/:_id', async (req, res) => {
    const _id = req.params._id;
    const { day, year, term, timeslot, roomNo, courseCode, teacherCode } = req.body;

    try {
        // Find the document based on the query
        let theoryExamComittee = await TheoryExamComittee.findById(_id);

        // Update the theoryExamComittee array
        if (theoryExamComittee) {
            theoryExamComittee[day][year][term][timeslot] = {
                isAllocated: true,
                courseCode: courseCode,
                teacherCode: teacherCode,
                room: roomNo
            };

            await theoryExamComittee.save();

            res.json({ success: true, data: theoryExamComittee });
        } else {
            res.json({ success: false, error: 'Something went wrong! Try again.' });
        }
    } catch (err) {
        res.json({ success: false, error: 'Internal Server Error' });
    }
});

module.exports = app;

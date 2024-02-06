const express = require('express');
const app = express.Router();
const mongoose = require('mongoose');
const Routine = mongoose.model('routine');

const routineManagementSchema = new mongoose.Schema({
    overall: {
        type: Array,
        required: true
    },
    yearTerm: {
        type: Array,
        required: true
    },
    routineTeachersName: {
        type: Array,
        required: true
    },
    year: {
        type: String,
        required: true
    },
    semester: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    yearSemester: { // yearSemester = year + semester
        type: String,
        unique: true,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const RoutineManagement = mongoose.model('RoutineManagement', routineManagementSchema);

// to store routine data permanently
app.post('/', async (req, res) => {
    try {
        // Retrieve the current routine data from the request body
        const currentRoutineData = req.body;

        // Save the current routine to the Routine model
        const currentRoutine = new Routine(currentRoutineData);
        await currentRoutine.save();

        // Save the current routine to the RoutineManagement model
        const routineManagement = new RoutineManagement({ routine: currentRoutineData });
        await routineManagement.save();

        res.json({ success: true, message: 'Routine published successfully.' });
    } catch (error) {
        console.error('Error publishing routine:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// Route to get routine by ID
app.get('/:year/:semester', async (req, res) => {
    try {
        const year = req.params.year, semester = req.params.semester;
        const routineId = year + semester;

        // Find the routine by yearSemester
        const routine = await RoutineManagement.findOne({ yearSemester: routineId });

        if (!routine) {
            return res.status(404).json({ error: 'Routine not found' });
        }

        res.json(routine);
    } catch (error) {
        console.error('Error retrieving routine by ID:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Route to get routine data by array index
app.get('/:arrayIndex', async (req, res) => {
    try {
        const arrayIndex = parseInt(req.params.arrayIndex, 10);

        // Find the routine and project only the specified array element by index
        const routine = await RoutineManagement.findOne({}, { overall: { $slice: [arrayIndex, 1] } });

        if (!routine) {
            return res.status(404).json({ error: 'Routine not found' });
        }

        // Extract the desired array element
        const arrayElement = routine.overall[0]; // $slice returns an array, so we pick the first element

        res.json({ arrayElement });
    } catch (error) {
        console.error('Error retrieving routine by index:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = app;

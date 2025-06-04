const express = require('express');
const app = express.Router();
const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
    timeSlot: Array
});

const TimeSlot = mongoose.model('timeSlot', timeSlotSchema);

const createTimeSlot = async () => {
    try {
        const newTimeSlot = new TimeSlot({
            timeSlot: [
                {
                    start: '9:00',
                    end: '9:45',
                    isLunchHour: false
                },
                {
                    start: '9:50',
                    end: '10:35',
                    isLunchHour: false
                },
                {
                    start: '10:40',
                    end: '11:25',
                    isLunchHour: false
                },
                {
                    start: '11:30',
                    end: '12:15',
                    isLunchHour: false
                },
                {
                    start: '12:15',
                    end: '1:00',
                    isLunchHour: false
                },
                {
                    start: '1:00',
                    end: '2:00',
                    isLunchHour: true
                },
                {
                    start: '2:00',
                    end: '2:50',
                    isLunchHour: false
                },
                {
                    start: '2:55',
                    end: '3:45',
                    isLunchHour: false
                },
            ]
        });

        const timeSlot = await newTimeSlot.save();
        console.log('Time-slot saved:', timeSlot);
    } catch (err) {
        console.error('Error saving time-slot:', err);
    }
};
// createTimeSlot();

// get time-slot
app.get("/", async (req, res) => {
    try {
        const timeSlot = await TimeSlot.find({});
        res.json({ success: true, data: timeSlot }); // Send the users as a JSON response
    } catch (error) {
        console.error("An error occurred in time-slot get function:", error);
        res.send({ success: false, error: "Internal Server Error" });
    }
});

// Update timeSlot array
app.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { timeSlot } = req.body;

        if (!Array.isArray(timeSlot)) {
            return res.status(400).json({ success: false, error: "Timeslot must be an array" });
        }

        const updatedTimeSlot = await TimeSlot.findByIdAndUpdate(
            id,
            { timeSlot },
            { new: true }
        );

        if (!updatedTimeSlot) {
            return res.status(404).json({ success: false, error: "TimeSlot document not found" });
        }

        res.json({ success: true, data: updatedTimeSlot });
    } catch (error) {
        console.error("An error occurred in time-slot PUT function:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});


module.exports = app;
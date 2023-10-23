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
                    end: '9:45'
                },
                {
                    start: '9:50',
                    end: '10:35'
                },
                {
                    start: '10:40',
                    end: '11:25'
                },
                {
                    start: '11:30',
                    end: '12:15'
                },
                {
                    start: '12:15',
                    end: '1:00'
                },
                {
                    start: '2:00',
                    end: '2:50'
                },
                {
                    start: '2:55',
                    end: '3:45'
                },
            ]
        });

        const timeSlot = await newTimeSlot.save();
        console.log('Time-slot saved:', timeSlot);
    } catch (err) {
        console.error('Error saving time-slot:', err);
    }
};
//createTimeSlot();

// get time-slot
app.get("/", async (req, resp) => {
    try {
        const timeSlot = await TimeSlot.find({});
        resp.json(timeSlot); // Send the users as a JSON response
    } catch (error) {
        console.error("An error occurred in time-slot get function:", error);
        resp.status(500).send("Internal Server Error");
    }
});

module.exports = app;
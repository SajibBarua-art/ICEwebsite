const express = require('express');
const app = express.Router();
const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    theory: Array,
    lab: Object
});

const Room = mongoose.model('room', roomSchema);
const createRoom = async () => {
    try {
        const newRoom = new Room({
            theory: ['809', '810'],
            lab: {
                computer: ['808', '812'],
                electrical: ['813']
            }
        });

        const room = await newRoom.save();
        console.log('Room saved:', room);
    } catch (err) {
        console.error('Error saving room:', err);
    }
};
// createRoom();

// get room
app.get("/", async (req, res) => {
    try {
        const room = await Room.find({});
        res.json({ success: true, data: room }); // Send the users as a JSON response
    } catch (error) {
        console.error("An error occurred in room get function:", error);
        res.send({ success: false, data: "Internal Server Error" });
    }
});

module.exports = app;
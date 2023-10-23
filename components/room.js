const express = require('express');
const app = express.Router();
const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    class: Array,
    lab: Object
});

const Room = mongoose.model('room', roomSchema);
const createRoom = async () => {
    try {
        const newRoom = new Room({
            class: ['809', '810'],
            lab: {
                computer: ['808', '812'],
                electrical: '813'
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
app.get("/", async (req, resp) => {
    try {
        const room = await Room.find({});
        resp.json(room); // Send the users as a JSON response
    } catch (error) {
        console.error("An error occurred in room get function:", error);
        resp.status(500).send("Internal Server Error");
    }
});

module.exports = app;
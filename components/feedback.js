const express = require('express');
const app = express.Router();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

// Create Mongoose schema and model for feedback
const feedbackSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: String,
    rating: Number,
    feedback: String,
});

const Feedback = mongoose.model('feedback', feedbackSchema);

// Middleware to parse JSON data
app.use(bodyParser.json());

// Route to get all feedback
app.get('/', async (req, res) => {
    try {
        const feedbackData = await Feedback.find();
        res.json(feedbackData);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Route to post new feedback
app.post('/', async (req, res) => {
    const { firstName, lastName, email, rating, feedback } = req.body;

    try {
        const newFeedback = new Feedback({
            firstName,
            lastName,
            email,
            rating,
            feedback,
        });

        const savedFeedback = await newFeedback.save();
        res.status(201).json(savedFeedback);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = app;
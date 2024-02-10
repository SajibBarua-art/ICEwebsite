// For backend and express
const express = require('express');
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;

require('dotenv').config();
app.use(express.json());
app.use(cors());
app.get("/", (req, res) => {
    res.send("App is Working");
});

// Connect to the database
const mongoose = require('mongoose');
mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.smd1bmx.mongodb.net/?retryWrites=true&w=majority`, {
    dbName: 'routine',
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('Connected to routine database');
})
.catch(err => {
    console.error('Error connecting to the database:', err);
});

const teacherSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        default: ""
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    mobile: {
        type: String
    },
    teacherCode: {
        type: String,
        required: true,
        unique: true
    },
    courses: {
        type: Array,
        required: false,
        default: []
    },
    designation: {
        type: String,
        required: true
    },
    department: {
        type: String,
        default: "ICE, NSTU"
    },
    password: {
        type: String,
        required: true
    },
    joiningDate: {
        type: Date,
        default: Date.now,
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    isInExamCommittee: {
        type: Boolean,
        default: false
    },
    isInRoutineCommittee: {
        type: Boolean,
        default: false
    }
});

const Teacher = mongoose.model('teachers', teacherSchema);
const fs = require('fs');
const teachersInfoString = fs.readFileSync('./database/teachersInfoString.json', 'utf-8');
const teachersInfo = JSON.parse(teachersInfoString); 

const createRoom = async () => {
    try {
        for(let teacher of teachersInfo) {
            teacher["mobile"] = "";
            teacher["designation"] = "Designation";
            teacher["departement"] = "ICE, NSTU";
            teacher["password"] = "j";
            teacher["joiningDate"] = teacher.date;
            delete teacher.date;
        }
        const insertedTeachers = await Teacher.insertMany(teachersInfo);
        console.log('Teachers saved:', insertedTeachers);
    } catch (err) {
        console.error('Error saving teachers:', err);
    }
};

createRoom();


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
const express = require('express');
const app = express();
const cors = require('cors');
app.use(express.json());
app.use(cors());

const teachers = [];
const students = [];
const timeSlot = [
  {
    start: '9:00',
    end: '9:45',
  },
  {
    start: '9:50',
    end: '10:35',
  },
  {
    start: '10:40',
    end: '11:25',
  },
  {
    start: '11:30',
    end: '12:15',
  },
  {
    start: '12:15',
    end: '1:00',
  },
  {
    start: '2:00',
    end: '2:50',
  },
  {
    start: '2:55',
    end: '3:45',
  },
];

app.get('/', (req, resp) => {
  resp.send('App is Working');
});

// Teachers
app.post('/teachers', (req, resp) => {
  const teacher = req.body;
  if (teachers.some((t) => t.email === teacher.email)) {
    resp.status(400).send('Teacher with the same email already exists');
  } else {
    teachers.push(teacher);
    resp.status(201).json(teacher);
  }
});

app.get('/teachers', (req, resp) => {
  resp.json(teachers);
});

// Students
app.post('/students', (req, resp) => {
  const student = req.body;
  if (students.some((s) => s.email === student.email)) {
    resp.status(400).send('Student with the same email already exists');
  } else {
    students.push(student);
    resp.status(201).json(student);
  }
});

app.get('/students', (req, resp) => {
  resp.json(students);
});

// Time Slot
app.get('/timeSlot', (req, resp) => {
  resp.json(timeSlot);
});

const port = 5000;
app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});

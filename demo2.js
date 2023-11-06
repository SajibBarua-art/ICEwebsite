const teacherSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
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
    }
});
const Teacher = mongoose.model('teachers', teacherSchema);

const fs = require('fs');
const teachersInfoString = fs.readFileSync('./database/teachersInfoString.json', 'utf-8');
const teachersInfo = JSON.parse(teachersInfoString); 

const createRoom = async () => {
    try {
        for(let teacher of teachersInfo) {
            const name = teacher.firstName + ' ' + teacher.lastName;
            delete teacher.firstName;
            delete teacher.lastName;
            teacher["name"] = name;
            teacher["mobile"] = "";
            teacher["designation"] = "NSTU";
            teacher["departement"] = "ICE";
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
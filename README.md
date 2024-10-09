# Teacher CoPilot

**Description**: The primary goal of this project is to reduce the hectic workload of a teacher. Built on the MERN stack, this application serves as the **backend** for the Teacher CoPilot, providing essential functionalities for creating, showing and storing the class routine, exam routine, duty roaster, exam committee and billing.

---

## Table of Contents
1. [Features](#features)
2. [Installation](#installation)
3. [Usage](#usage)
4. [Technologies Used](#technologies-used)
5. [Contributing](#contributing)
6. [Contact](#contact)

---

## Features
- **Generate** a class routine, exam routine, exam committee or duty roaster by performing only one API call.
- **Show** a class routine, exam routine, exam committee or duty roaster by performing only one API call.
- Show teachers information.
- Show and update admin panel.

---

## Installation

Provide a step-by-step guide to setting up the project locally.

1. **Clone the repository:**

   ```bash
   git clone https://github.com/SajibBarua-art/ICEwebsite.git
   ```

2. **Navigate to the project directory:**

   ```bash
   cd ICEwebsite
   ```

3. **Install dependencies:**

   ```bash
   npm install
   ```
4. **.env setup:**
   ```
   DB_USER = 'your_mongodb_username'
   DB_PASS = 'your_mongodb_password'
   DB_NAME = 'database_name'
   ```

4. **To start the frontend development server:**
   

   To start the server:
   ```
   npm start
   ```

   Using Nodemon (for Development):
   ```
   npx nodemon index.js
   ```
---

## Usage
### Databases name and their basic object structure:
**1. teachers (teachers information)**  
- firstName - string  
- lastName - string  
- email – string (unique)  
- mobile - string
- teacherCode – string (unique)  
- courses – Array (only course code)  
- designation - string
- department - string
- joiningDate - Date
- isAdmin - Boolean
- isInExamCommittee - Boolean
- isInRoutineCommittee - Boolean

Api’s:  
- To get or post teacher details: api/teachers  
- To update the courses of a teacher: api/teachers/${teacherCode}/courses  
  
**2. students (students information)**  
- firstName - string  
- lastName - string  
- email – string (unique)  
- year – Number (1/2/3/4) (select by dropdown)  
- term – Number(1/2) (select by dropdown)  
- session – String  
- ID – String  

Api’s:  
- To get or post student details: api/students  

**3. courseDetails**  
- code – string  
- name – string  
- year – Number (1/2/3/4) (select by dropdown)  
- term – Number(1/2) (select by dropdown)  
- type - string (electrical/computer/theory) (select by dropdown)  
- credit – Number (1/2/3) (select by dropdown)  

Api’s:  
- To get or post course details: api/courseDetails  

**4. timeSlot**  
- timeSlot – array  
&emsp; > start - string  
&emsp; > end - string  

Api’s:  
- To get all the timeSlot: api/timeSlot  
  
**5. room**  
- class – array  
- lab - object  
&emsp; > computer - array  
&emsp; > electrical – string  

Api’s:  
- To get all the room details: api/room  
  
**6. generateRandomRoutine:** To generate and store a new routine. It also gives the new generated routine as response.  
Api’s:  
- To generate: api/generateRandomRoutine?year=${getYear}&semester=${getSemester}&date=${getDate}
  
**7. routine**  
- overall: array (4D), dimensions: [day][year][term][timeSlot]  
- yearTerm: Array
- routineTeachersName: Array
- year: String
- semester: String
- date: Date

*Overview of the overall array:*
- day: range[0, 4]; 0 means 'Sunday', 1 means 'Monday' and so on.
- year: range[1, 4]; 
- term: range[1, 2];
- timeSlot: range[0, 6];

Example: Suppose, you want to access the Year: 3 and Term: 2 routine. Then dimensions will be [day][3][2][timeSlot].

Api’s:  
- To only get the routine(It will not generate a new routine): api/routine  

**8. generateExamCommittee:** To generate and store a new theory exam committee. It also gives the new generated theory exam committee as response.
Api's:
- To generate, store and get the generated theory exam committee: api/generateExamCommittee

**9. examCommittee**
- theory: array (2D), dimensions: [year][term]

Api's: 
- To only get the theory exam committee(It will not generate a new exam committee): api/examCommittee
  
**10. generateLabExamCommittee:** To generate and store a new lab exam committee. It also gives the new generated lab exam committee as response.
Api's:
- To generate, store and get the generated lab exam committee: api/generateLabExamCommittee

**11. labExamCommittee**
- lab: array(2D), dimensions: [year][term]

Api's: 
- To only get the lab exam committee(It will not generate a new lab exam committee): api/labExamCommittee

**12. admin panel**
- api to update status: api/teacher/updateAdminStatus

**13. exam committee panel**
- api to update status: api/teacher/updateExamCommitteeStatus

**14. routine committee panel**
- api to update status: api/teacher/updateRoutineCommitteeStatus

**15. course distribution**
- To get: api/courseDistribution?examYear=${getExamYear}&semester=${getSemester}
- To post: api/courseDistribution
- To update/put: api/courseDistribution/update

**16. class routine management**
- To post: api/classRoutineManagement
- To get by year and semester: api/classRoutineManagement/${getYear}/${getSemester}
- To get by array index: api/classRoutineManagement/${routineIndex}

---

## Technologies Used
- **body-parser**: version 1.20.2
- **cmap**: version 0.1.3
- **cors**: version 2.8.5
- **dotenv**: version 16.3.1
- **express**: version 4.18.2
- **fastpriorityqueue**: version 0.7.4
- **mongodb**: version 6.2.0
- **mongoose**: version 7.6.3
- **nodemon**: version 3.0.1
- **punycode.js**: version 2.3.0

---

## Contributing
- Fork the repository.
- Create a new branch ```(git checkout -b feature-branch)```
- Commit your changes ```(git commit -m 'Add some feature')```
- Push to the branch ```(git push origin feature-branch)```
- Open a pull request.

---

## Contact
For any kinds of suggestions, issues, or contributions:
- Email: sajib715b@gmail.com
- LinkedIn: [Sajib Barua](https://www.linkedin.com/in/sajib-barua-475814203) or
            [Subreena](https://www.linkedin.com/in/subreena-264a181b1/)
### Databases name and their basic object structure:
**1. teachers (teachers information)**
    a. firstName - string
    b. lastName - string
    c. email – string (unique)
    d. teacherCode – string (unique)
    e. courses – Array (only course code)
Api’s: 
    a.To get or post teacher details: api/teachers
	b.To update the courses of a teacher: api/

**2. students (students information)**
    a. firstName - string
    b.lastName - string
    c. email – string (unique)
    d. year – Number (1/2/3/4) (select by dropdown)
    e. term – Number(1/2) (select by dropdown)
    f. session – String
    g. ID – String
Api’s:
    a. To get or post teacher details: api/teachers

**3. courseDetails**
    a. code – string
    b. name – string
    c. year – Number (1/2/3/4) (select by dropdown)
    d. term – Number(1/2) (select by dropdown)
    e. type - string (electrical/computer/theory) (select by dropdown)
    f. credit – Number (1/2/3) (select by dropdown)
Api’s:
    a. To get or post course details: api/courseDetails

**4. timeSlot**
    a. timeSlot – array
    I. start - string
    II. end - string
Api’s:
    a. To get all the timeSlot: api/timeSlot

**5. room**
    a. class – array
    b. lab - object 
        I. computer - array
        II. electrical – string
Api’s:
    a. To get all the room details: api/room

**6. generateRandomRoutine:**To generate and store routine. It also gives a response as the generated routine to the client.

Api’s:
    a. To generate, store and get the generated routine: api/generateRandomRoutine

**7. routine**
    a. overall - array (4D) dimensions: [day][year][term][timeSlot]
Api’s:
    a. To only get store routine(it’s not generate the routine): api/routine



**Scratch Front End code link:**https://github.com/SajibBarua-art/ICEwebsiteScratchClient
**Backend code link:**https://github.com/SajibBarua-art/ICEwebsite
**API:**https://ice-9duauifmg-sajib-baruas-projects.vercel.app/
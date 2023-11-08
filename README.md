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
- To generate, store and get the generated routine: api/generateRandomRoutine  
  
**7. routine**  
- overall: array (4D), dimensions: [day][year][term][timeSlot]  

*Overview of the overall array:*
- day: range[0, 4]; 0 means 'Sunday', 1 means 'Monday' and so on.
- year: range[1, 4]; 
- term: range[1, 2];
- timeSlot: range[0, 6];

Example: Suppose, you want to access the Year: 3 and Term: 2 routine. Then dimensions will be [day][3][2][timeSlot].

Api’s:  
- To only get the routine(It will not generate a new routine): api/routine  

**8. generateExamCommittee** To generate and store a new exam committee. It also gives the new generated exam committee as response.
Api's:
- To generate, store and get the generated exam committee: api/generateExamCommittee

**9. examCommittee**
- theory: array (2D), dimensions: [year][term]

Api's: 
- To only get the exam committee(It will not generate a new exam committee): api/examCommittee
  
  
  
**Scratch Front End code link:** https://github.com/SajibBarua-art/ICEwebsiteScratchClient  
**Backend code link:** https://github.com/SajibBarua-art/ICEwebsite  
**API:**  
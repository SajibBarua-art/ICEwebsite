### Databases name and their basic object structure:
**1. teachers (teachers information)**  
- firstName - string  
- lastName - string  
- email – string (unique)  
- teacherCode – string (unique)  
- courses – Array (only course code)  

Api’s:  
- To get or post teacher details: api/teachers  
- To update the courses of a teacher: api/  
  
**2. students (students information)**  
- firstName - string  
- lastName - string  
- email – string (unique)  
- year – Number (1/2/3/4) (select by dropdown)  
- term – Number(1/2) (select by dropdown)  
- session – String  
- ID – String  

Api’s:  
- To get or post teacher details: api/teachers  

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
- - start - string  
- - II. end - string  

Api’s:  
- To get all the timeSlot: api/timeSlot  
  
**5. room**  
- class – array  
- lab - object  
- - computer - array  
- -  electrical – string  

Api’s:  
- To get all the room details: api/room  
  
**6. generateRandomRoutine:** To generate and store routine. It also gives a response as the generated routine to the client.  
Api’s:  
- To generate, store and get the generated routine: api/generateRandomRoutine  
  
**7. routine**  
- overall - array (4D) dimensions: [day][year][term][timeSlot]  
Api’s:  
- To only get store routine(it’s not generate the routine): api/routine  
  
  
  
**Scratch Front End code link:** https://github.com/SajibBarua-art/ICEwebsiteScratchClient  
**Backend code link:** https://github.com/SajibBarua-art/ICEwebsite  
**API:** https://ice-9duauifmg-sajib-baruas-projects.vercel.app/  
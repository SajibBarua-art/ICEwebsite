// Function to get the day of the week for the current date
const getDayOfWeek = (timestamp) => {
    // Get the current timestamp in milliseconds

    // Create a Date object from the current timestamp
    const currentDate = new Date(timestamp);

    // Get the day of the week (0 for Sunday, 1 for Monday, etc.)
    const dayOfWeek = currentDate.getDay();

    // Define an array of day names
    // ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return dayOfWeek
}

// Function to sort an array of objects by year and term in descending order
const sortObjectsByYearAndTerm = (objectsArray) => {
    // Custom comparison function
    const compareObjects = (a, b) => {
        // Compare by year
        if (a.year < b.year) {
            return 1;
        } else if (a.year > b.year) {
            return -1;
        } else {
            // If the years are the same, compare by term
            if (a.term < b.term) {
                return 1;
            } else if (a.term > b.term) {
                return -1;
            } else {
                // If the terms are the same, you can add additional logic if needed
                return 0;
            }
        }
    }

    // Sort the array of objects using the custom comparison function
    return objectsArray.sort(compareObjects);
}

const startDate = '2024-01-24';
const buildTheoryExamRoutine = () => {
    let currentDate = new Date(startDate);
    const courses = ['3201', '3202', '3203', '3205', '2201', '2202', '2203', '2204'];
    const unavialableDates = ['2024-01-28', '2024-01-29', '2024-01-24', '2022-11-05'];
    let theoryExamRoutine = [];

    for (const course of courses) {
        let dayIndex = getDayOfWeek(currentDate);
        
        // Skip weekends (Friday and Saturday)
        while (dayIndex === 5 || dayIndex === 6) {
            currentDate.setDate(currentDate.getDate() + 1);
            dayIndex = getDayOfWeek(currentDate);
        }

        // Skip unavailable dates
        while (unavialableDates.includes(currentDate.toISOString().split('T')[0])) {
            currentDate.setDate(currentDate.getDate() + 1);
            dayIndex = getDayOfWeek(currentDate);
        }

        const allocation = {
            date: new Date(currentDate),
            course: course
        };

        console.log(allocation.date.toLocaleDateString(), course);
        
        // Add three days (3 * 24 hours) to the date for the next course
        currentDate.setDate(currentDate.getDate() + 3);
    }
}
buildTheoryExamRoutine();
// https://ice-6jk5m23f6-sajib-baruas-projects.vercel.app/

// MAH: ICE-1201, ICE-3201, ICE-1202
// KMAU: ICE-1203, ICE-2203, ICE-2204
// MSE: ICE-1205, ICE-1206, ICE-2207, ICE-2208
// MMA: ICE-2201, ICE-2202, ICE-4205, ICE-4206, ICE-3207
// MKH: ICE-2205, ICE-3205, ICE-2206, ICE-3206
// TZK: ICE-2209, ICE-4201, ICE-4202
// SJS: ICE-4212, ICE-4211, ICE-3202, ICE-3204, ICE-3203
// TS: HUM-1207
// MJH: MATH-2211, ICE-4203, ICE-4204
// MMR: ICE-3209, ICE-4207, ICE-4208, ICE-3210
// MRH: MATH-1211
// BMS: BLWS

let teacherInd = 0;
        teacher = teachersInfoSortedByJoiningDate[teacherInd];
        while(takenTeachers[i].has(teacher.teacherCode)) {
            teacherInd++;
            if(teacherInd === teachersInfoSortedByJoiningDate.length) {
                teacherInd = 0;
            }
            teacher = teachersInfoSortedByJoiningDate[teacherInd];
        }
        teachersInfoSortedByJoiningDate.push(teachersInfoSortedByJoiningDate[teacherInd]);
        teachersInfoSortedByJoiningDate.splice(teacherInd, 1);
        takenTeachers[i].add(teacher.teacherCode);
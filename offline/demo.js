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

const FastPriorityQueue = require('fastpriorityqueue');

// Create a priority queue
const priorityQueue = new FastPriorityQueue((a, b) => a.priority > b.priority);

// Enqueue elements with priorities
priorityQueue.add({code: 'jjj', priority: 3});
priorityQueue.add({code: 'aaa', priority: 1});
priorityQueue.add({code: 'kkk', priority: 2});

// Dequeue elements with the highest priority
console.log("Front element:", priorityQueue.poll()); // Output: 1
console.log("Front element:", priorityQueue.poll()); // Output: 2

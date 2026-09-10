// JavaScript Refresher — complete solution

const show = (id, value) => {
  document.getElementById(id).textContent = value;
};

const format = (value) => JSON.stringify(value, null, 2);

// 1 — Variables and Data Types
const studentName = "Anna";
const age = 21;
const active = true;
const courses = ["JavaScript", "React", "CSS"];
const address = { city: "Almaty", street: "Abay Ave" };
const emptyValue = null;
let notAssigned;

const task1 = `
name: ${studentName} | type: ${typeof studentName}
age: ${age} | type: ${typeof age}
active: ${active} | type: ${typeof active}
courses: ${format(courses)} | type: ${typeof courses}
address: ${format(address)} | type: ${typeof address}
null: ${emptyValue} | type: ${typeof emptyValue}
undefined: ${notAssigned} | type: ${typeof notAssigned}

Template literal:
Hello, my name is ${studentName}, I am ${age} years old and I study ${courses[0]}.

Primitive examples: string, number, boolean, null, undefined.
Reference examples: object and array.
`;
show("task1", task1);

// 2 — Arrays
const numbers = [3, 7, 2, 10, 5];
const doubled = numbers.map(n => n * 2);
const greaterThanFive = numbers.filter(n => n > 5);
const firstGreaterThanFive = numbers.find(n => n > 5);
const sum = numbers.reduce((total, n) => total + n, 0);
const hasTen = numbers.includes(10);

show("task2", `Original: ${format(numbers)}
map — multiply by 2: ${format(doubled)}
filter — numbers > 5: ${format(greaterThanFive)}
find — first number > 5: ${firstGreaterThanFive}
reduce — sum: ${sum}
includes — 10 exists: ${hasTen}

Original unchanged: ${format(numbers)}`);

// 3 — Arrays of Objects
const students = [
  { id: 1, name: "Anna", grade: 85 },
  { id: 2, name: "John", grade: 62 },
  { id: 3, name: "Sara", grade: 91 },
  { id: 4, name: "Mike", grade: 55 }
];

const goodStudents = students.filter(s => s.grade >= 70);
const studentNames = students.map(s => s.name);
const student3 = students.find(s => s.id === 3);
const topStudent = students.reduce((top, s) => s.grade > top.grade ? s : top);
const averageGrade = students.reduce((total, s) => total + s.grade, 0) / students.length;
const passedInfo = students.map(s => ({ ...s, passed: s.grade >= 70 }));

show("task3", `Students with grade >= 70:
${format(goodStudents)}

Names:
${format(studentNames)}

Student with id = 3:
${format(student3)}

Highest grade:
${format(topStudent)}

Average grade:
${averageGrade}

New array with passed:
${format(passedInfo)}

Original objects remain unchanged:
${format(students)}`);

// 4 — Objects
const user = {
  id: 1,
  name: "Anna",
  age: 21,
  address: { city: "Almaty", street: "Abay Ave" }
};

const readName = user.name;
const readCity = user.address.city;
user.age = 22;
user.email = "anna@example.com";
delete user.address.street;

const { name: userName, age: userAge } = user;
const { address: { city } } = user;

show("task4", `Name: ${readName}
City: ${readCity}
After changing age: ${user.age}
After adding email: ${user.email}
After removing street: ${format(user)}

Destructuring:
userName = ${userName}
userAge = ${userAge}
city = ${city}`);

// 5 — Values and References
const original = { name: "Alice", score: 10 };
const copy = original;
copy.score = 20;

const spreadCopy = { ...original };
spreadCopy.score = 30;

const nestedUser = { name: "Alice", address: { city: "Almaty" } };
const shallowCopy = { ...nestedUser };
shallowCopy.address.city = "Shymkent";

const deepCopy = {
  ...nestedUser,
  address: { ...nestedUser.address }
};
deepCopy.address.city = "Astana";

show("task5", `original after copy.score = 20:
${format(original)}

Reason: copy and original reference the same object.

After spread copy and changing spreadCopy.score:
original:
${format(original)}
spreadCopy:
${format(spreadCopy)}

Nested object example:
Changing shallowCopy.address.city also changes nestedUser.address.city because spread is shallow.

nestedUser:
${format(nestedUser)}

Correct nested copy:
deepCopy:
${format(deepCopy)}
The nested address was copied separately.`);

// 6 — Functions
function isEven(number) {
  return number % 2 === 0;
}

const getFullName = (firstName, lastName) => `${firstName} ${lastName}`;
const calculatePrice = (price, quantity) => price * quantity;
const calculateDiscount = (price, percent) => price - price * percent / 100;
const getMax = (a, b) => Math.max(a, b);

// Normal function rewritten as arrow function:
// function isEven(number) { return number % 2 === 0; }
// const isEvenArrow = number => number % 2 === 0;

show("task6", `isEven(8) = ${isEven(8)}
getFullName("Anna", "Smith") = ${getFullName("Anna", "Smith")}
calculatePrice(100, 3) = ${calculatePrice(100, 3)}
calculateDiscount(200, 15) = ${calculateDiscount(200, 15)}
getMax(8, 12) = ${getMax(8, 12)}

A normal function can be rewritten as an arrow function.`);

// 7 — Functions as Values
const add = (a, b) => a + b;
const multiply = (a, b) => a * b;

const calculate = (a, b, operation) => operation(a, b);

show("task7", `calculate(5, 3, add) = ${calculate(5, 3, add)}
calculate(5, 3, multiply) = ${calculate(5, 3, multiply)}

Functions can be stored in variables: yes.
Functions can be passed to other functions: yes.
add means the function itself.
add() means calling/executing the function (without arguments here).`);

// 8 — Scope
const message = "global";
let scopeOutput = `Global level: ${message}\n`;

function scopeDemo() {
  const message = "function";
  scopeOutput += `Function level: ${message}\n`;

  if (true) {
    const message = "block";
    scopeOutput += `Block level: ${message}\n`;
  }

  var varInsideBlock = "var";
  let letInsideBlock = "let";
  const constInsideBlock = "const";

  scopeOutput += `Inside block: var=${varInsideBlock}, let=${letInsideBlock}, const=${constInsideBlock}\n`;
  return { varInsideBlock, letInsideBlock, constInsideBlock };
}

const scopeVars = scopeDemo();
scopeOutput += `Outside function, var/let/const declared inside function are inaccessible.\n`;
scopeOutput += `Global message is still: ${message}\n`;
scopeOutput += `var is function-scoped; let and const are block-scoped.\n`;

show("task8", scopeOutput);

// 9 — Closure
function createCounter() {
  let count = 0;
  return function () {
    count++;
    return count;
  };
}

const counter = createCounter();
const counter2 = createCounter();

function createAdder(value) {
  return function (number) {
    return value + number;
  };
}

const addFive = createAdder(5);

show("task9", `counter() -> ${counter()}
counter() -> ${counter()}
counter() -> ${counter()}

second counter() -> ${counter2()}
second counter() -> ${counter2()}

addFive(10) -> ${addFive(10)}
addFive(20) -> ${addFive(20)}

Closure: the inner function keeps access to variables from its outer function even after the outer function has finished.`);

// 10 — Destructuring, Spread and Rest
const nums10 = [10, 20, 30, 40];
const [first, second] = nums10;

const user10 = { id: 1, name: "Anna", age: 21 };
const { name, age: userAge10 } = user10;

const numbersWith50 = [...nums10, 50];
const newUser = { ...user10, age: 22 };
const userWithEmail = { ...user10, email: "anna@example.com" };
const combinedArrays = [...[1, 2], ...[3, 4]];

const sumRest = (...numbers) => numbers.reduce((total, n) => total + n, 0);

show("task10", `First two values: ${first}, ${second}
User name and age: ${name}, ${userAge10}

New numbers array:
${format(numbersWith50)}

New user with age 22:
${format(newUser)}

User with email, original unchanged:
${format(userWithEmail)}
Original:
${format(user10)}

Combined arrays:
${format(combinedArrays)}

sum(1, 2) = ${sumRest(1, 2)}
sum(1, 2, 3, 4) = ${sumRest(1, 2, 3, 4)}

Spread (...) expands an iterable/object into another array or object.
Rest (...) collects multiple arguments/elements into one array.`);

// 11 — Optional Chaining and Default Values
const userWithAddress = { name: "Anna", address: { city: "Almaty" } };
const userWithoutAddress = { name: "John" };

let unsafeResult;
try {
  unsafeResult = userWithoutAddress.address.city;
} catch (error) {
  unsafeResult = "Error: cannot read city from undefined";
}

const safeCity = userWithoutAddress.address?.city ?? "City not specified";

const comparisons = {
  "0 || 'default'": 0 || "default",
  "0 ?? 'default'": 0 ?? "default",
  "'' || 'default'": "" || "default",
  "'' ?? 'default'": "" ?? "default",
  "false || 'default'": false || "default",
  "false ?? 'default'": false ?? "default",
  "null || 'default'": null || "default",
  "null ?? 'default'": null ?? "default",
  "undefined || 'default'": undefined || "default",
  "undefined ?? 'default'": undefined ?? "default"
};

show("task11", `Existing address city: ${userWithAddress.address?.city ?? "City not specified"}
Without address, direct access:
${unsafeResult}

Optional chaining + nullish coalescing:
${safeCity}

|| uses the right side for any falsy value.
?? uses the right side only for null or undefined.

Comparison:
${format(comparisons)}`);

// Final Task
const finalStudents = [
  { id: 1, name: "Anna", age: 21, grades: [85, 90, 88] },
  { id: 2, name: "John", age: 22, grades: [62, 70, 65] },
  { id: 3, name: "Sara", age: 20, grades: [91, 95, 94] },
  { id: 4, name: "Mike", age: 23, grades: [55, 60, 58] },
  { id: 5, name: "Emma", age: 21, grades: [78, 82, 80] }
];

const getAverage = grades =>
  grades.reduce((total, grade) => total + grade, 0) / grades.length;

const getStudentAverage = student => getAverage(student.grades);

const getPassedStudents = students =>
  students.filter(student => getStudentAverage(student) >= 70);

const getStudentNames = students =>
  students.map(student => student.name);

const findStudent = (students, id) =>
  students.find(student => student.id === id);

const getTopStudent = students =>
  students.reduce((top, student) =>
    getStudentAverage(student) > getStudentAverage(top) ? student : top
  );

const studentResults = finalStudents.map(student => ({
  id: student.id,
  name: student.name,
  average: Number(getStudentAverage(student).toFixed(2)),
  passed: getStudentAverage(student) >= 70
}));

const finalText = `Average of Anna's grades: ${getStudentAverage(finalStudents[0])}

Passed students:
${format(getPassedStudents(finalStudents))}

Student names:
${format(getStudentNames(finalStudents))}

Find student id = 3:
${format(findStudent(finalStudents, 3))}

Top student:
${format(getTopStudent(finalStudents))}

Final result array:
${format(studentResults)}

Original data was not modified.`;

show("finalTask", finalText);

const table = `
<table>
  <thead>
    <tr><th>ID</th><th>Name</th><th>Average</th><th>Passed</th></tr>
  </thead>
  <tbody>
    ${studentResults.map(s => `
      <tr>
        <td>${s.id}</td>
        <td>${s.name}</td>
        <td>${s.average}</td>
        <td>${s.passed ? "true" : "false"}</td>
      </tr>`).join("")}
  </tbody>
</table>`;
document.getElementById("studentTable").innerHTML = table;

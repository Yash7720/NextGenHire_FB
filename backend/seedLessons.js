console.log("Script starting...");
require("dotenv").config();
const mongoose = require("mongoose");
const Lesson = require("./models/Lesson");

const lessons = [
  // --- JAVASCRIPT ---
  // Chapter 1
  {
    course: "javascript",
    chapter: "JS Fundamentals",
    title: "Variables",
    content: "<h2>JavaScript Variables</h2><p>Variables are used to store data...</p>",
    example: "let name = 'John';\nlet age = 22;",
    tips: "Use let for variables that change and const for fixed values."
  },
  {
    course: "javascript",
    chapter: "JS Fundamentals",
    title: "Data Types",
    content: "<h2>JavaScript Data Types</h2><p>JavaScript has 8 Datatypes. String, Number, Bigint, Boolean, Undefined, Null, Symbol, Object...</p>",
    example: "let length = 16;\nlet lastName = 'Johnson';\nlet x = {firstName:'John'};",
    tips: "JavaScript variables can hold many data types."
  },
  {
    course: "javascript",
    chapter: "JS Fundamentals",
    title: "Operators",
    content: "<h2>JavaScript Operators</h2><p>Used to perform arithmetic and assignments...</p>",
    example: "let x = 5;\nlet y = 2;\nlet z = x * y;",
    tips: "Strict equality (===) checks value AND type."
  },
  // Chapter 2
  {
    course: "javascript",
    chapter: "Functions",
    title: "Declaration",
    content: "<h2>Function Declaration</h2><p>A function is defined with the function keyword, followed by a name, followed by parentheses ().</p>",
    example: "function myFunction(p1, p2) {\n  return p1 * p2;\n}",
    tips: "Functions are the main 'building blocks' of the program."
  },
  {
    course: "javascript",
    chapter: "Functions",
    title: "Arrow Functions",
    content: "<h2>Arrow Functions</h2><p>Arrow functions allow us to write shorter function syntax.</p>",
    example: "const x = (x, y) => x * y;",
    tips: "Arrow functions do not have their own 'this'. They are not well suited for defining object methods."
  },
  {
    course: "javascript",
    chapter: "Functions",
    title: "Closures",
    content: "<h2>JavaScript Closures</h2><p>A closure is the combination of a function bundled together (enclosed) with references to its surrounding state (the lexical environment).</p>",
    example: "function makeFunc() {\n  const name = 'Mozilla';\n  function displayName() {\n    console.log(name);\n  }\n  return displayName;\n}",
    tips: "Closures are useful because they let you associate data with a function that operates on that data."
  },
  // Chapter 3
  {
    course: "javascript",
    chapter: "DOM Manipulation",
    title: "querySelector",
    content: "<h2>The querySelector() Method</h2><p>returns the first Element within the document that matches the specified selector, or group of selectors.</p>",
    example: "const el = document.querySelector('.myclass');",
    tips: "Use querySelectorAll() if you need to select multiple elements."
  },
  {
    course: "javascript",
    chapter: "DOM Manipulation",
    title: "Events",
    content: "<h2>DOM Events</h2><p>HTML events are 'things' that happen to HTML elements. JavaScript can 'react' to these events.</p>",
    example: "element.addEventListener('click', () => {\n  alert('Clicked!');\n});",
    tips: "Event propagation (bubbling) is an important concept to understand when handling events."
  },
  {
    course: "javascript",
    chapter: "DOM Manipulation",
    title: "Dynamic Content",
    content: "<h2>Creating Dynamic Content</h2><p>You can use methods like createElement() and appendChild() to dynamically add elements to the DOM.</p>",
    example: "const newDiv = document.createElement('div');\nnewDiv.innerHTML = 'Hello World';\ndocument.body.appendChild(newDiv);",
    tips: "Updating innerHTML frequently can be less efficient than using textContent or specific DOM methods."
  },
  // Chapter 4
  {
    course: "javascript",
    chapter: "Async JavaScript",
    title: "Promises",
    content: "<h2>JavaScript Promises</h2><p>A Promise is an object representing the eventual completion or failure of an asynchronous operation.</p>",
    example: "const myPromise = new Promise((resolve, reject) => {\n  setTimeout(() => resolve('Success!'), 1000);\n});",
    tips: "Promises have three states: pending, fulfilled, or rejected."
  },
  {
    course: "javascript",
    chapter: "Async JavaScript",
    title: "Async/Await",
    content: "<h2>Async and Await</h2><p>Async and Await make promises easier to write. async makes a function return a Promise, await makes a function wait for a Promise.</p>",
    example: "async function fetchData() {\n  const res = await fetch('https://api.example.com');\n  const data = await res.json();\n}",
    tips: "Always use try/catch blocks with await for error handling."
  },
  {
    course: "javascript",
    chapter: "Async JavaScript",
    title: "Fetch API",
    content: "<h2>The Fetch API</h2><p>The Fetch API provides an interface for fetching resources (including across the network). It is a more powerful and flexible replacement for XMLHttpRequest.</p>",
    example: "fetch('https://api.example.com/data')\n  .then(response => response.json())\n  .then(data => console.log(data));",
    tips: "Fetch only rejects on network errors. You must check response.ok for 4xx/5xx responses."
  },
  // Chapter 5
  {
    course: "javascript",
    chapter: "ES6+ Features",
    title: "Destructuring",
    content: "<h2>Destructuring Assignment</h2><p>The destructuring assignment syntax is a JavaScript expression that makes it possible to unpack values from arrays, or properties from objects, into distinct variables.</p>",
    example: "const user = { name: 'Alice', age: 25 };\nconst { name, age } = user;",
    tips: "Use destructuring to cleanly extract necessary fields from large objects or API responses."
  },
  {
    course: "javascript",
    chapter: "ES6+ Features",
    title: "Spread/Rest",
    content: "<h2>Spread & Rest Operators</h2><p>The spread operator (...) allows an iterable to expand in places where zero or more arguments or elements are expected. The rest parameter syntax allows a function to accept an indefinite number of arguments as an array.</p>",
    example: "const arr1 = [1, 2, 3];\nconst arr2 = [...arr1, 4, 5]; // Spread\n\nfunction sum(...args) { return args.reduce((a, b) => a + b); } // Rest",
    tips: "Spread is great for creating shallow copies of objects and arrays."
  },
  {
    course: "javascript",
    chapter: "ES6+ Features",
    title: "Modules",
    content: "<h2>JavaScript Modules</h2><p>Modules allow you to break up your code into separate files. This makes it easier to maintain a code-base. Modules are imported using the import statement and exported using the export statement.</p>",
    example: "// math.js\nexport const add = (a, b) => a + b;\n\n// main.js\nimport { add } from './math.js';\nconsole.log(add(2, 3));",
    tips: "Modules automatically run in strict mode."
  },

  // --- HTML ---
  {
    course: "html",
    chapter: "Introduction to HTML",
    title: "What is HTML?",
    content: "<h2>What is HTML?</h2><p>HTML stands for Hyper Text Markup Language. It describes the structure of a Web page.</p>",
    example: "<!DOCTYPE html>\n<html>\n<body>\n<h1>My First Heading</h1>\n</body>\n</html>",
    tips: "HTML is not a programming language; it's a markup language."
  },
  {
    course: "html",
    chapter: "Introduction to HTML",
    title: "Document Structure",
    content: "<h2>HTML Document Structure</h2><p>A basic HTML document has tags like &lt;html&gt;, &lt;head&gt;, and &lt;body&gt;.</p>",
    example: "<html>\n  <head><title>Page Title</title></head>\n  <body>Content here</body>\n</html>",
    tips: "The <!DOCTYPE html> declaration is not an HTML tag; it's an instruction to the web browser about what version of HTML the page is written in."
  },

  // --- CSS ---
  {
    course: "css",
    chapter: "CSS Basics",
    title: "Selectors",
    content: "<h2>CSS Selectors</h2><p>CSS selectors are used to 'find' (or select) the HTML elements you want to style.</p>",
    example: "p {\n  text-align: center;\n  color: red;\n}\n\n.my-class {\n  font-weight: bold;\n}",
    tips: "Combine class and element selectors to target very specific DOM nodes."
  },
  {
    course: "css",
    chapter: "CSS Basics",
    title: "Properties",
    content: "<h2>CSS Properties</h2><p>A CSS rule consists of a selector and a declaration block. Properties define what styling aspect you're changing.</p>",
    example: "body {\n  background-color: #333;\n  margin: 0;\n}",
    tips: "Learn standard properties inside out before reaching for a framework."
  },
  {
    course: "css",
    chapter: "CSS Basics",
    title: "Values",
    content: "<h2>CSS Values</h2><p>The value tells the engine HOW to style the property. Values can be colors, pixels, percentages, etc.</p>",
    example: "div {\n  width: 100%;\n  padding: 15px;\n}",
    tips: "Use relative values like rem or em for better accessibility."
  }
];

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB. Seeding...");
    // Drop all old seed tests
    // Standardize: ensure we delete both "js" and "javascript" to avoid duplicates or leftovers
    await Lesson.deleteMany({ course: { $in: ["javascript", "js", "css", "html"] } });
    await Lesson.insertMany(lessons);
    console.log("Lessons seeded successfully!");
    process.exit();
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

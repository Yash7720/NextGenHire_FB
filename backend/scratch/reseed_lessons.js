require('dotenv').config();
const mongoose = require('mongoose');
const Lesson = require('../models/Lesson');

// Complete, clean lesson data for ALL courses - matching the frontend data/index.js EXACTLY
const CLEAN_LESSONS = [
  // ── HTML ──────────────────────────────────────────────────────────────────────
  // Chapter 1: Introduction to HTML
  { course: 'html', chapter: 'Introduction to HTML', title: 'What is HTML?',
    content: '<h2>What is HTML?</h2><p>HTML stands for HyperText Markup Language.</p><p>It is used to structure content on the web.</p><ul><li>Defines webpage structure</li><li>Uses tags and elements</li><li>Works with CSS and JavaScript</li></ul>',
    example: '<!DOCTYPE html>\n<html>\n<body>\n<h1>Hello World</h1>\n</body>\n</html>',
    output: 'Hello World displayed as a heading on the webpage.',
    tips: 'HTML is the foundation of every webpage.' },
  { course: 'html', chapter: 'Introduction to HTML', title: 'Document Structure',
    content: '<h2>HTML Document Structure</h2><p>Every HTML page follows a standard structure.</p><ul><li>&lt;!DOCTYPE html&gt;</li><li>&lt;html&gt;</li><li>&lt;head&gt;</li><li>&lt;body&gt;</li></ul>',
    example: '<!DOCTYPE html>\n<html>\n<head>\n<title>My Page</title>\n</head>\n<body>\n<p>This is a webpage.</p>\n</body>\n</html>',
    output: 'This is a webpage.',
    tips: 'The head section contains metadata while body contains visible content.' },
  { course: 'html', chapter: 'Introduction to HTML', title: 'Tags & Elements',
    content: '<h2>HTML Tags and Elements</h2><p>HTML uses tags to define elements.</p><ul><li>Opening tag</li><li>Content</li><li>Closing tag</li></ul>',
    example: '<p>This is a paragraph.</p>',
    output: 'This is a paragraph.',
    tips: 'Most HTML elements have opening and closing tags.' },
  // Chapter 2: Text & Formatting
  { course: 'html', chapter: 'Text & Formatting', title: 'Headings & Paragraphs',
    content: '<h2>Headings and Paragraphs</h2><p>HTML provides six heading levels (&lt;h1&gt; to &lt;h6&gt;) and the &lt;p&gt; tag for paragraphs.</p>',
    example: '<h1>Main Heading</h1>\n<h2>Sub Heading</h2>\n<p>This is a paragraph of text.</p>',
    output: 'Main Heading displayed large, Sub Heading smaller, then a paragraph.',
    tips: 'Use only one <h1> per page for good SEO.' },
  { course: 'html', chapter: 'Text & Formatting', title: 'Lists',
    content: '<h2>HTML Lists</h2><p>HTML supports ordered (&lt;ol&gt;) and unordered (&lt;ul&gt;) lists.</p>',
    example: '<ul>\n  <li>Apple</li>\n  <li>Banana</li>\n</ul>',
    output: '• Apple\n• Banana',
    tips: 'Use ordered lists for sequential steps and unordered for general collections.' },
  { course: 'html', chapter: 'Text & Formatting', title: 'Bold & Italic',
    content: '<h2>Text Formatting</h2><p>Use &lt;strong&gt; for bold and &lt;em&gt; for italic text.</p>',
    example: '<p>This is <strong>bold</strong> and this is <em>italic</em>.</p>',
    output: 'This is bold and this is italic.',
    tips: '<strong> and <em> have semantic meaning; prefer them over <b> and <i>.' },
  // Chapter 3: Links & Images
  { course: 'html', chapter: 'Links & Images', title: 'Anchor Tags',
    content: '<h2>Anchor Tags</h2><p>The &lt;a&gt; tag creates hyperlinks to other pages or resources.</p>',
    example: '<a href="https://example.com" target="_blank">Visit Example</a>',
    output: 'A clickable link "Visit Example" that opens in a new tab.',
    tips: 'Always add rel="noopener noreferrer" with target="_blank" for security.' },
  { course: 'html', chapter: 'Links & Images', title: 'Image Tags',
    content: '<h2>Image Tags</h2><p>The &lt;img&gt; tag embeds images. It is a self-closing tag.</p>',
    example: '<img src="photo.jpg" alt="A beautiful landscape" width="500">',
    output: 'Image displayed on the page.',
    tips: 'Always include the alt attribute for accessibility and SEO.' },
  { course: 'html', chapter: 'Links & Images', title: 'Attributes',
    content: '<h2>HTML Attributes</h2><p>Attributes provide additional information about HTML elements. They are placed inside the opening tag.</p>',
    example: '<a href="https://google.com" title="Go to Google" target="_blank">Google</a>',
    output: 'A link to Google that opens in a new tab.',
    tips: 'Attributes always come in name/value pairs: name="value".' },
  // Chapter 4: Forms & Input
  { course: 'html', chapter: 'Forms & Input', title: 'Form Element',
    content: '<h2>HTML Forms</h2><p>The &lt;form&gt; element is used to collect user input. The action attribute defines where to send the form data.</p>',
    example: '<form action="/submit" method="POST">\n  <!-- inputs go here -->\n</form>',
    output: 'A form container ready to collect user input.',
    tips: 'Use POST method for sensitive data like passwords.' },
  { course: 'html', chapter: 'Forms & Input', title: 'Input Types',
    content: '<h2>Input Types</h2><p>The &lt;input&gt; element can have many types: text, email, password, checkbox, radio, submit.</p>',
    example: '<input type="text" placeholder="Name">\n<input type="email" placeholder="Email">\n<input type="password" placeholder="Password">',
    output: 'Three input fields for name, email, and password.',
    tips: 'Use the correct input type for better mobile keyboard support.' },
  { course: 'html', chapter: 'Forms & Input', title: 'Labels & Buttons',
    content: '<h2>Labels and Buttons</h2><p>The &lt;label&gt; tag associates text with a form control. The &lt;button&gt; tag creates a clickable button.</p>',
    example: '<label for="name">Name:</label>\n<input id="name" type="text">\n<button type="submit">Submit</button>',
    output: 'A labeled input field followed by a submit button.',
    tips: 'Always pair labels with inputs using the for/id combination for accessibility.' },
  // Chapter 5: Semantic HTML
  { course: 'html', chapter: 'Semantic HTML', title: 'Header/Footer',
    content: '<h2>Header and Footer</h2><p>&lt;header&gt; contains introductory content or navigation. &lt;footer&gt; contains information about the page or copyright.</p>',
    example: '<header>\n  <h1>My Website</h1>\n  <nav>...</nav>\n</header>\n<footer>\n  <p>&copy; 2024</p>\n</footer>',
    output: 'A structured page with a clear header and footer.',
    tips: 'A page can have multiple headers/footers but usually just one of each.' },
  { course: 'html', chapter: 'Semantic HTML', title: 'Article/Section',
    content: '<h2>Article and Section</h2><p>&lt;article&gt; is for self-contained content. &lt;section&gt; groups related content.</p>',
    example: '<article>\n  <h2>Blog Post Title</h2>\n  <p>Content of the blog post.</p>\n</article>',
    output: 'A self-contained blog post article.',
    tips: 'If content can be shared independently, use <article>. Otherwise, use <section>.' },
  { course: 'html', chapter: 'Semantic HTML', title: 'Accessibility',
    content: '<h2>HTML Accessibility</h2><p>Semantic HTML improves accessibility for users with disabilities by giving screen readers meaningful context.</p>',
    example: '<button aria-label="Close modal">X</button>\n<img src="logo.png" alt="Company Logo">',
    output: 'Screen readers can announce the button and image meaningfully.',
    tips: 'Use ARIA attributes when native semantics are not enough.' },

  // ── CSS ───────────────────────────────────────────────────────────────────────
  { course: 'css', chapter: 'CSS Basics', title: 'Selectors',
    content: '<h2>CSS Selectors</h2><p>Selectors target HTML elements to apply styles. Types: element, class, ID, attribute, pseudo-class.</p>',
    example: 'p { color: red; }\n.intro { font-size: 18px; }\n#header { background: blue; }',
    output: 'Paragraphs are red, elements with class "intro" are 18px, and the header is blue.',
    tips: 'Combine selectors for specificity without over-complicating your stylesheets.' },
  { course: 'css', chapter: 'CSS Basics', title: 'Properties',
    content: '<h2>CSS Properties</h2><p>Properties define what aspect of an element you are styling. Common ones: color, background, font-size, margin, padding.</p>',
    example: 'body {\n  background-color: #fff;\n  font-family: Arial, sans-serif;\n  margin: 0;\n}',
    output: 'White background, Arial font, no default margin.',
    tips: 'Use shorthand properties (e.g., margin: 10px 20px) to write less code.' },
  { course: 'css', chapter: 'CSS Basics', title: 'Values',
    content: '<h2>CSS Values</h2><p>Values specify how properties should be applied. Values can be colors, lengths (px, em, rem, %), or keywords.</p>',
    example: 'div {\n  width: 100%;\n  padding: 1rem;\n  color: #333;\n}',
    output: 'Full-width div with 1rem padding and dark gray text.',
    tips: 'Use rem for font sizes and % or viewport units for layouts for better responsiveness.' },
  { course: 'css', chapter: 'Box Model', title: 'Margin & Padding',
    content: '<h2>Margin and Padding</h2><p>Margin is space OUTSIDE the border. Padding is space INSIDE the border between content and border.</p>',
    example: '.box {\n  margin: 20px;\n  padding: 15px;\n}',
    output: 'Box has 20px space around it and 15px space inside it.',
    tips: 'Use margin: 0 auto to horizontally center a block element.' },
  { course: 'css', chapter: 'Box Model', title: 'Border',
    content: '<h2>CSS Border</h2><p>The border property adds a border around an element. Shorthand: border: width style color.</p>',
    example: '.card {\n  border: 2px solid #ccc;\n  border-radius: 8px;\n}',
    output: 'A card with a rounded 2px gray border.',
    tips: 'Use border-radius to create rounded corners and circles.' },
  { course: 'css', chapter: 'Box Model', title: 'Width/Height',
    content: '<h2>Width and Height</h2><p>Set element dimensions using width and height. Use box-sizing: border-box to include padding in the size.</p>',
    example: '.box {\n  width: 300px;\n  height: 200px;\n  box-sizing: border-box;\n}',
    output: 'A 300x200 pixel box where padding is included in the dimensions.',
    tips: 'Set box-sizing: border-box globally with * { box-sizing: border-box; }.' },
  { course: 'css', chapter: 'Flexbox', title: 'Flex Container',
    content: '<h2>Flex Container</h2><p>Display flex on a parent makes its children flex items. Use flex-direction to control layout axis.</p>',
    example: '.container {\n  display: flex;\n  flex-direction: row;\n  gap: 16px;\n}',
    output: 'Children are arranged horizontally with 16px gaps.',
    tips: 'Flexbox is one-dimensional — use Grid for two-dimensional layouts.' },
  { course: 'css', chapter: 'Flexbox', title: 'Flex Items',
    content: '<h2>Flex Items</h2><p>Flex items can grow and shrink. Use flex-grow, flex-shrink, and flex-basis to control their behavior.</p>',
    example: '.item {\n  flex: 1; /* shorthand for grow:1 shrink:1 basis:0 */\n}',
    output: 'Items share equal space within the container.',
    tips: 'flex: 1 is the most common value you will use for equal-width items.' },
  { course: 'css', chapter: 'Flexbox', title: 'Alignment',
    content: '<h2>Flexbox Alignment</h2><p>justify-content aligns along the main axis. align-items aligns along the cross axis.</p>',
    example: '.center {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  height: 100vh;\n}',
    output: 'Content is perfectly centered in the viewport.',
    tips: 'This justify-content + align-items pattern is the easiest way to center anything.' },
  { course: 'css', chapter: 'Grid Layout', title: 'Grid Template',
    content: '<h2>Grid Template</h2><p>Define columns and rows using grid-template-columns and grid-template-rows.</p>',
    example: '.grid {\n  display: grid;\n  grid-template-columns: 1fr 1fr 1fr;\n  gap: 20px;\n}',
    output: 'A three-column equal-width grid with 20px gaps.',
    tips: 'The fr unit means "fraction of the remaining space".' },
  { course: 'css', chapter: 'Grid Layout', title: 'Grid Areas',
    content: '<h2>Grid Areas</h2><p>Name grid areas to create complex layouts with grid-template-areas.</p>',
    example: '.layout {\n  display: grid;\n  grid-template-areas:\n    "header header"\n    "sidebar main"\n    "footer footer";\n}',
    output: 'A classic header-sidebar-main-footer page layout.',
    tips: 'Grid areas make complex layouts readable and easy to rearrange.' },
  { course: 'css', chapter: 'Grid Layout', title: 'Auto-fit/fill',
    content: '<h2>Auto-fit and Auto-fill</h2><p>Create responsive grids without media queries using auto-fit or auto-fill with minmax().</p>',
    example: '.responsive-grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));\n  gap: 16px;\n}',
    output: 'A responsive grid that automatically adjusts columns based on available space.',
    tips: 'auto-fit collapses empty tracks while auto-fill keeps them.' },
  { course: 'css', chapter: 'Animations', title: 'Transitions',
    content: '<h2>CSS Transitions</h2><p>Smoothly animate property changes over time using the transition property.</p>',
    example: '.btn {\n  background: blue;\n  transition: background 0.3s ease, transform 0.2s;\n}\n.btn:hover {\n  background: darkblue;\n  transform: scale(1.05);\n}',
    output: 'Button smoothly changes color and scales up on hover.',
    tips: 'Animate only transform and opacity for best performance (GPU accelerated).' },
  { course: 'css', chapter: 'Animations', title: 'Keyframes',
    content: '<h2>CSS Keyframes</h2><p>@keyframes define multi-step animations. Use animation to apply them.</p>',
    example: '@keyframes fadeIn {\n  from { opacity: 0; }\n  to { opacity: 1; }\n}\n.modal {\n  animation: fadeIn 0.3s ease;\n}',
    output: 'Modal fades in smoothly.',
    tips: 'Use animation-fill-mode: both to keep the final animation state.' },
  { course: 'css', chapter: 'Animations', title: 'Transform',
    content: '<h2>CSS Transform</h2><p>Transform lets you rotate, scale, skew, and translate elements without affecting document flow.</p>',
    example: '.card:hover {\n  transform: translateY(-8px) scale(1.02);\n}',
    output: 'Card lifts up slightly and scales on hover.',
    tips: 'Transforms do not trigger layout recalculation — they are very performant.' },

  // ── JAVASCRIPT ───────────────────────────────────────────────────────────────
  { course: 'javascript', chapter: 'JS Fundamentals', title: 'Variables',
    content: '<h2>JavaScript Variables</h2><p>Variables store data. Use <code>let</code> for reassignable values, <code>const</code> for constants, and avoid <code>var</code>.</p>',
    example: 'const name = "Alice";\nlet age = 25;\nage = 26; // OK\n// name = "Bob"; // Error!',
    output: 'name is "Alice", age is 26.',
    tips: 'Default to const and only use let when you need to reassign.' },
  { course: 'javascript', chapter: 'JS Fundamentals', title: 'Data Types',
    content: '<h2>JavaScript Data Types</h2><p>Primitive types: String, Number, Boolean, null, undefined, Symbol, BigInt. Objects are reference types.</p>',
    example: 'const str = "Hello";\nconst num = 42;\nconst bool = true;\nconst arr = [1, 2, 3];\nconst obj = { key: "value" };',
    output: 'Different data types assigned to variables.',
    tips: 'typeof null returns "object" — a historical JavaScript quirk.' },
  { course: 'javascript', chapter: 'JS Fundamentals', title: 'Operators',
    content: '<h2>JavaScript Operators</h2><p>Arithmetic (+,-,*,/,%), comparison (===, !==, >, <), logical (&&, ||, !), and assignment (=, +=, -=) operators.</p>',
    example: 'const x = 10;\nconst y = 3;\nconsole.log(x + y); // 13\nconsole.log(x === 10); // true\nconsole.log(x > 5 && y < 5); // true',
    output: '13, true, true',
    tips: 'Always use === (strict equality) instead of == to avoid type coercion bugs.' },
  { course: 'javascript', chapter: 'Functions', title: 'Declaration',
    content: '<h2>Function Declaration</h2><p>Functions are reusable blocks of code. They can accept parameters and return values.</p>',
    example: 'function greet(name) {\n  return `Hello, ${name}!`;\n}\nconsole.log(greet("Alice")); // Hello, Alice!',
    output: 'Hello, Alice!',
    tips: 'Function declarations are hoisted — they can be called before they are defined.' },
  { course: 'javascript', chapter: 'Functions', title: 'Arrow Functions',
    content: '<h2>Arrow Functions</h2><p>Arrow functions are a concise syntax for writing functions. They do not have their own <code>this</code>.</p>',
    example: 'const add = (a, b) => a + b;\nconst square = n => n * n;\nconsole.log(add(3, 4)); // 7\nconsole.log(square(5)); // 25',
    output: '7, 25',
    tips: 'Arrow functions are perfect for callbacks but avoid them as object methods.' },
  { course: 'javascript', chapter: 'Functions', title: 'Closures',
    content: '<h2>Closures</h2><p>A closure is a function that remembers the variables from its outer scope even after the outer function has finished executing.</p>',
    example: 'function makeCounter() {\n  let count = 0;\n  return () => ++count;\n}\nconst counter = makeCounter();\nconsole.log(counter()); // 1\nconsole.log(counter()); // 2',
    output: '1, 2',
    tips: 'Closures are the basis for data encapsulation and factory functions in JavaScript.' },
  { course: 'javascript', chapter: 'DOM Manipulation', title: 'querySelector',
    content: '<h2>querySelector</h2><p>Select DOM elements using CSS selectors. querySelector returns the first match; querySelectorAll returns all matches.</p>',
    example: 'const btn = document.querySelector("#submit-btn");\nconst items = document.querySelectorAll(".list-item");\nconsole.log(items.length);',
    output: 'The button element and a NodeList of all list items.',
    tips: 'Convert NodeList to an array using Array.from() to use array methods on it.' },
  { course: 'javascript', chapter: 'DOM Manipulation', title: 'Events',
    content: '<h2>DOM Events</h2><p>Events allow you to react to user interactions like clicks, input, and key presses.</p>',
    example: 'const btn = document.querySelector("button");\nbtn.addEventListener("click", (e) => {\n  console.log("Clicked!", e.target);\n});',
    output: '"Clicked!" logged with the button element when clicked.',
    tips: 'Use addEventListener instead of onclick to support multiple handlers.' },
  { course: 'javascript', chapter: 'DOM Manipulation', title: 'Dynamic Content',
    content: '<h2>Dynamic Content</h2><p>Create and insert elements dynamically with createElement, textContent, and appendChild.</p>',
    example: 'const ul = document.querySelector("ul");\nconst li = document.createElement("li");\nli.textContent = "New Item";\nul.appendChild(li);',
    output: 'A new list item "New Item" added to the unordered list.',
    tips: 'Use DocumentFragment to batch DOM insertions for better performance.' },
  { course: 'javascript', chapter: 'Async JavaScript', title: 'Promises',
    content: '<h2>Promises</h2><p>A Promise represents an eventual value. It can be pending, fulfilled, or rejected. Chain with .then() and .catch().</p>',
    example: 'const fetchUser = () => new Promise((resolve) => {\n  setTimeout(() => resolve({ name: "Alice" }), 1000);\n});\nfetchUser().then(user => console.log(user.name));',
    output: '"Alice" logged after 1 second.',
    tips: 'Always add a .catch() handler to promises to avoid silent failures.' },
  { course: 'javascript', chapter: 'Async JavaScript', title: 'Async/Await',
    content: '<h2>Async/Await</h2><p>async/await is syntactic sugar over Promises, making asynchronous code look synchronous and easier to read.</p>',
    example: 'async function getUser() {\n  try {\n    const res = await fetch("/api/user");\n    const data = await res.json();\n    return data;\n  } catch (err) {\n    console.error(err);\n  }\n}',
    output: 'Fetches user data from an API and returns it.',
    tips: 'Always wrap await calls in try/catch to handle errors properly.' },
  { course: 'javascript', chapter: 'Async JavaScript', title: 'Fetch API',
    content: '<h2>Fetch API</h2><p>The Fetch API provides a modern way to make HTTP requests. It returns a Promise that resolves to the Response object.</p>',
    example: 'fetch("https://api.example.com/users")\n  .then(res => res.json())\n  .then(data => console.log(data))\n  .catch(err => console.error(err));',
    output: 'User data from the API logged to the console.',
    tips: 'Fetch only rejects on network failure; always check res.ok for HTTP errors.' },
  { course: 'javascript', chapter: 'ES6+ Features', title: 'Destructuring',
    content: '<h2>Destructuring</h2><p>Extract values from arrays or properties from objects into distinct variables.</p>',
    example: 'const user = { name: "Alice", age: 25, city: "NY" };\nconst { name, age } = user;\n\nconst [first, , third] = [10, 20, 30];\nconsole.log(name, age, first, third);',
    output: 'Alice 25 10 30',
    tips: 'Destructuring in function parameters keeps APIs clean: function f({ id, name }) {}.' },
  { course: 'javascript', chapter: 'ES6+ Features', title: 'Spread/Rest',
    content: '<h2>Spread and Rest</h2><p>Spread (...) expands iterables. Rest (...) collects arguments into an array.</p>',
    example: '// Spread\nconst arr = [1, 2, 3];\nconst clone = [...arr, 4, 5]; // [1,2,3,4,5]\n\n// Rest\nfunction sum(...nums) {\n  return nums.reduce((a, b) => a + b, 0);\n}\nsum(1, 2, 3, 4); // 10',
    output: '[1,2,3,4,5] and 10',
    tips: 'Use spread to create shallow copies of objects and arrays to avoid mutation.' },
  { course: 'javascript', chapter: 'ES6+ Features', title: 'Modules',
    content: '<h2>ES6 Modules</h2><p>Modules let you split code across files. Use export to share and import to consume.</p>',
    example: '// math.js\nexport const add = (a, b) => a + b;\nexport default function multiply(a, b) { return a * b; }\n\n// main.js\nimport multiply, { add } from "./math.js";\nconsole.log(add(2, 3), multiply(2, 3));',
    output: '5 6',
    tips: 'Default exports are for the main thing in a file; named exports for utilities.' },

  // ── PYTHON ────────────────────────────────────────────────────────────────────
  { course: 'python', chapter: 'Python Basics', title: 'Syntax',
    content: '<h2>Python Syntax</h2><p>Python uses indentation to define code blocks instead of curly braces. No semicolons needed.</p>',
    example: 'if True:\n    print("Hello, Python!")\n    print("Indentation matters!")',
    output: 'Hello, Python!\nIndentation matters!',
    tips: 'Use 4 spaces for indentation, not tabs, to follow Python convention (PEP 8).' },
  { course: 'python', chapter: 'Python Basics', title: 'Variables',
    content: '<h2>Python Variables</h2><p>Python is dynamically typed — you do not need to declare types. Variables are created on assignment.</p>',
    example: 'name = "Alice"\nage = 25\nheight = 5.6\nis_student = True\nprint(type(name), type(age))',
    output: "<class 'str'> <class 'int'>",
    tips: 'Use snake_case for variable names in Python (e.g., user_name, not userName).' },
  { course: 'python', chapter: 'Python Basics', title: 'Print',
    content: '<h2>Python Print Function</h2><p>print() outputs data to the console. It supports f-strings for formatting.</p>',
    example: 'name = "Alice"\nage = 25\nprint(f"My name is {name} and I am {age} years old.")',
    output: 'My name is Alice and I am 25 years old.',
    tips: 'f-strings (f"...") are the most readable way to format strings in Python 3.6+.' },
  { course: 'python', chapter: 'Control Flow', title: 'if/else',
    content: '<h2>if/else Statements</h2><p>Conditional statements control which code block runs based on a condition.</p>',
    example: 'score = 85\nif score >= 90:\n    print("A")\nelif score >= 70:\n    print("B")\nelse:\n    print("C")',
    output: 'B',
    tips: 'Python uses elif (not else if) for multiple conditions.' },
  { course: 'python', chapter: 'Control Flow', title: 'for loops',
    content: '<h2>for Loops</h2><p>for loops iterate over any iterable (list, string, range, etc.).</p>',
    example: 'fruits = ["apple", "banana", "cherry"]\nfor fruit in fruits:\n    print(fruit)\n\nfor i in range(3):\n    print(i)',
    output: 'apple\nbanana\ncherry\n0\n1\n2',
    tips: 'Use enumerate(list) to get both index and value in a for loop.' },
  { course: 'python', chapter: 'Control Flow', title: 'while loops',
    content: '<h2>while Loops</h2><p>while loops run as long as a condition is True. Use break and continue to control flow.</p>',
    example: 'count = 0\nwhile count < 5:\n    print(count)\n    count += 1',
    output: '0\n1\n2\n3\n4',
    tips: 'Always ensure the condition eventually becomes False to avoid infinite loops.' },
  { course: 'python', chapter: 'Functions', title: 'def',
    content: '<h2>Defining Functions</h2><p>Use the def keyword to define a function. Python supports default parameters and type hints.</p>',
    example: 'def greet(name, greeting="Hello"):\n    return f"{greeting}, {name}!"\n\nprint(greet("Alice"))\nprint(greet("Bob", "Hi"))',
    output: 'Hello, Alice!\nHi, Bob!',
    tips: 'Define default parameters at the end of the parameter list.' },
  { course: 'python', chapter: 'Functions', title: 'Parameters',
    content: '<h2>Function Parameters</h2><p>Python supports positional, keyword, *args, and **kwargs parameters.</p>',
    example: 'def info(*args, **kwargs):\n    print(args)\n    print(kwargs)\n\ninfo(1, 2, 3, name="Alice", age=25)',
    output: '(1, 2, 3)\n{\'name\': \'Alice\', \'age\': 25}',
    tips: 'Use **kwargs to accept any keyword arguments — great for flexible APIs.' },
  { course: 'python', chapter: 'Functions', title: 'Return Values',
    content: '<h2>Return Values</h2><p>Functions return values with return. Python can return multiple values as a tuple.</p>',
    example: 'def minmax(lst):\n    return min(lst), max(lst)\n\nlo, hi = minmax([3, 1, 4, 1, 5, 9])\nprint(lo, hi)',
    output: '1 9',
    tips: 'Returning multiple values is Pythonic and very readable.' },
  { course: 'python', chapter: 'Data Structures', title: 'Lists',
    content: '<h2>Python Lists</h2><p>Lists are ordered, mutable collections. They support indexing, slicing, and a rich set of methods.</p>',
    example: 'nums = [3, 1, 4, 1, 5]\nnums.append(9)\nnums.sort()\nprint(nums)\nprint(nums[2:5])',
    output: '[1, 1, 3, 4, 5, 9]\n[3, 4, 5]',
    tips: 'Use list comprehensions [x*2 for x in lst] for concise transformations.' },
  { course: 'python', chapter: 'Data Structures', title: 'Dicts',
    content: '<h2>Python Dictionaries</h2><p>Dictionaries store key-value pairs. Keys must be immutable (strings, numbers, tuples).</p>',
    example: 'user = {"name": "Alice", "age": 25}\nuser["city"] = "NY"\nprint(user.get("name"))\nfor key, val in user.items():\n    print(key, ":", val)',
    output: 'Alice\nname : Alice\nage : 25\ncity : NY',
    tips: 'Use dict.get(key, default) to avoid KeyError when a key might not exist.' },
  { course: 'python', chapter: 'Data Structures', title: 'Tuples',
    content: '<h2>Python Tuples</h2><p>Tuples are ordered, immutable collections. They are faster than lists and great for fixed data.</p>',
    example: 'point = (10, 20)\nx, y = point\nprint(x, y)\n\ncolors = ("red", "green", "blue")\nprint(colors[0])',
    output: '10 20\nred',
    tips: 'Use tuples for data that should not change, like coordinates or RGB values.' },
  { course: 'python', chapter: 'OOP', title: 'Classes',
    content: '<h2>Python Classes</h2><p>Classes are blueprints for objects. Use class to define and __init__ to initialize instances.</p>',
    example: 'class Dog:\n    def __init__(self, name, breed):\n        self.name = name\n        self.breed = breed\n\n    def bark(self):\n        print(f"{self.name} says Woof!")\n\ndog = Dog("Rex", "Labrador")\ndog.bark()',
    output: 'Rex says Woof!',
    tips: 'self is a convention for the first parameter of instance methods — it refers to the instance.' },
  { course: 'python', chapter: 'OOP', title: 'Inheritance',
    content: '<h2>Inheritance</h2><p>A class can inherit attributes and methods from another class. Use super() to call the parent class.</p>',
    example: 'class Animal:\n    def __init__(self, name):\n        self.name = name\n    def speak(self):\n        return "..."\n\nclass Cat(Animal):\n    def speak(self):\n        return f"{self.name} says Meow!"\n\nprint(Cat("Whiskers").speak())',
    output: 'Whiskers says Meow!',
    tips: 'Prefer composition over inheritance for complex relationships.' },
  { course: 'python', chapter: 'OOP', title: 'Methods',
    content: '<h2>Python Methods</h2><p>Instance methods receive self. Class methods use @classmethod with cls. Static methods use @staticmethod.</p>',
    example: 'class Counter:\n    count = 0\n    def __init__(self):\n        Counter.count += 1\n\n    @classmethod\n    def get_count(cls):\n        return cls.count\n\nCounter()\nCounter()\nprint(Counter.get_count())',
    output: '2',
    tips: 'Use @staticmethod for utility functions that do not need access to self or cls.' },

  // ── C++ ───────────────────────────────────────────────────────────────────────
  { course: 'cpp', chapter: 'CPP Basics', title: 'Syntax',
    content: '<h2>C++ Syntax</h2><p>C++ is a compiled language with strict syntax. Every statement ends with a semicolon. Braces define code blocks.</p>',
    example: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}',
    output: 'Hello, World!',
    tips: 'Always include the correct headers and remember return 0 in main().' },
  { course: 'cpp', chapter: 'CPP Basics', title: 'Data Types',
    content: '<h2>C++ Data Types</h2><p>Common types: int, float, double, char, bool, string. C++ is statically typed.</p>',
    example: 'int age = 25;\ndouble pi = 3.14159;\nbool isValid = true;\nstring name = "Alice";\nchar grade = \'A\';',
    output: 'Variables of different types declared and initialized.',
    tips: 'Use double over float for decimal numbers to avoid precision issues.' },
  { course: 'cpp', chapter: 'CPP Basics', title: 'I/O',
    content: '<h2>C++ Input/Output</h2><p>Use cout for output and cin for input. Include &lt;iostream&gt; header.</p>',
    example: '#include <iostream>\nusing namespace std;\n\nint main() {\n    string name;\n    cout << "Enter your name: ";\n    cin >> name;\n    cout << "Hello, " << name << "!" << endl;\n    return 0;\n}',
    output: 'Prompts for name, then greets the user.',
    tips: 'Use getline(cin, str) to read a full line including spaces.' },
  { course: 'cpp', chapter: 'Pointers & Memory', title: 'Pointers',
    content: '<h2>C++ Pointers</h2><p>A pointer stores the memory address of a variable. Declare with * and get address with &.</p>',
    example: 'int x = 10;\nint* ptr = &x;\ncout << ptr << endl;  // address\ncout << *ptr << endl; // value (dereference)',
    output: '0x... (memory address)\n10',
    tips: 'Always initialize pointers; uninitialized pointers cause undefined behavior.' },
  { course: 'cpp', chapter: 'Pointers & Memory', title: 'References',
    content: '<h2>C++ References</h2><p>A reference is an alias for an existing variable. Unlike pointers, references cannot be null or reassigned.</p>',
    example: 'int x = 10;\nint& ref = x;\nref = 20;\ncout << x << endl; // 20',
    output: '20',
    tips: 'Pass by reference (void f(int& x)) to modify variables without copying.' },
  { course: 'cpp', chapter: 'Pointers & Memory', title: 'Dynamic Allocation',
    content: '<h2>Dynamic Memory Allocation</h2><p>Use new to allocate heap memory and delete to free it. Always pair them to prevent memory leaks.</p>',
    example: 'int* arr = new int[5];\nfor (int i = 0; i < 5; i++) arr[i] = i * 2;\nfor (int i = 0; i < 5; i++) cout << arr[i] << " ";\ndelete[] arr;',
    output: '0 2 4 6 8',
    tips: 'Prefer smart pointers (unique_ptr, shared_ptr) over raw new/delete in modern C++.' },
  { course: 'cpp', chapter: 'OOP in CPP', title: 'Classes',
    content: '<h2>C++ Classes</h2><p>A class bundles data and functions. Members are private by default; use public to expose them.</p>',
    example: 'class Rectangle {\npublic:\n    double width, height;\n    double area() { return width * height; }\n};\n\nRectangle r;\nr.width = 5; r.height = 3;\ncout << r.area();',
    output: '15',
    tips: 'Use structs for plain data objects and classes when you need encapsulation.' },
  { course: 'cpp', chapter: 'OOP in CPP', title: 'Constructors',
    content: '<h2>C++ Constructors</h2><p>Constructors initialize objects. They have the same name as the class and no return type.</p>',
    example: 'class Point {\npublic:\n    int x, y;\n    Point(int x, int y) : x(x), y(y) {}\n};\n\nPoint p(3, 4);\ncout << p.x << ", " << p.y;',
    output: '3, 4',
    tips: 'Use initializer lists (:) in constructors for better performance.' },
  { course: 'cpp', chapter: 'OOP in CPP', title: 'Polymorphism',
    content: '<h2>C++ Polymorphism</h2><p>Polymorphism allows the same interface to work with different types. Use virtual functions for runtime polymorphism.</p>',
    example: 'class Shape {\npublic:\n    virtual double area() = 0; // pure virtual\n};\nclass Circle : public Shape {\n    double r;\npublic:\n    Circle(double r) : r(r) {}\n    double area() override { return 3.14 * r * r; }\n};',
    output: 'Circle overrides area() with its own calculation.',
    tips: 'Always declare the destructor as virtual in base classes to avoid memory leaks.' },
  { course: 'cpp', chapter: 'STL', title: 'Vectors',
    content: '<h2>STL Vectors</h2><p>vector is a dynamic array that grows automatically. It is the most commonly used STL container.</p>',
    example: '#include <vector>\nvector<int> v = {1, 2, 3};\nv.push_back(4);\nfor (int x : v) cout << x << " ";',
    output: '1 2 3 4',
    tips: 'Use v.reserve(n) to pre-allocate memory if you know the size in advance.' },
  { course: 'cpp', chapter: 'STL', title: 'Maps',
    content: '<h2>STL Maps</h2><p>map stores key-value pairs sorted by key. unordered_map is faster for lookups but unsorted.</p>',
    example: '#include <map>\nmap<string, int> scores;\nscores["Alice"] = 95;\nscores["Bob"] = 88;\nfor (auto& [name, score] : scores)\n    cout << name << ": " << score << endl;',
    output: 'Alice: 95\nBob: 88',
    tips: 'Use unordered_map for O(1) average lookups when order does not matter.' },
  { course: 'cpp', chapter: 'STL', title: 'Algorithms',
    content: '<h2>STL Algorithms</h2><p>The &lt;algorithm&gt; header provides sort, find, count, transform, and many more functions.</p>',
    example: '#include <algorithm>\n#include <vector>\nvector<int> v = {3, 1, 4, 1, 5, 9};\nsort(v.begin(), v.end());\nfor (int x : v) cout << x << " ";',
    output: '1 1 3 4 5 9',
    tips: 'STL algorithms work on ranges (begin/end iterators) and are well-optimized.' },
  { course: 'cpp', chapter: 'Templates', title: 'Function Templates',
    content: '<h2>Function Templates</h2><p>Templates allow writing a single function that works with any data type.</p>',
    example: 'template <typename T>\nT myMax(T a, T b) {\n    return (a > b) ? a : b;\n}\ncout << myMax(3, 7) << endl;    // 7\ncout << myMax(3.5, 2.1) << endl; // 3.5',
    output: '7\n3.5',
    tips: 'The compiler generates a separate function for each type used with a template.' },
  { course: 'cpp', chapter: 'Templates', title: 'Class Templates',
    content: '<h2>Class Templates</h2><p>Class templates create generic classes that work with any data type, like the STL containers.</p>',
    example: 'template <typename T>\nclass Box {\n  T value;\npublic:\n  Box(T v) : value(v) {}\n  T get() { return value; }\n};\n\nBox<int> ib(42);\nBox<string> sb("hello");\ncout << ib.get() << " " << sb.get();',
    output: '42 hello',
    tips: 'Class templates are the foundation of the entire C++ STL library.' },
  { course: 'cpp', chapter: 'Templates', title: 'Metaprogramming',
    content: '<h2>Template Metaprogramming</h2><p>Compute values at compile time using templates. The compiler evaluates these during compilation.</p>',
    example: 'template <int N>\nstruct Factorial {\n    static const int value = N * Factorial<N-1>::value;\n};\ntemplate <>\nstruct Factorial<0> { static const int value = 1; };\n\ncout << Factorial<5>::value; // 120',
    output: '120 (computed at compile time)',
    tips: 'Modern C++ prefers constexpr functions over template metaprogramming for clarity.' },

  // ── REACT ─────────────────────────────────────────────────────────────────────
  { course: 'react', chapter: 'React Fundamentals', title: 'JSX',
    content: '<h2>JSX</h2><p>JSX is JavaScript XML — a syntax extension that lets you write HTML-like code inside JavaScript. Babel compiles it to React.createElement() calls.</p>',
    example: 'const element = (\n  <div className="greeting">\n    <h1>Hello, {name}!</h1>\n  </div>\n);',
    output: 'A div with a greeting heading.',
    tips: 'Use className instead of class, and htmlFor instead of for in JSX.' },
  { course: 'react', chapter: 'React Fundamentals', title: 'Components',
    content: '<h2>React Components</h2><p>Components are the building blocks of React. They are JavaScript functions that return JSX. Names must start with a capital letter.</p>',
    example: 'function Greeting({ name }) {\n  return <h1>Hello, {name}!</h1>;\n}\n\n// Usage\n<Greeting name="Alice" />',
    output: 'Hello, Alice!',
    tips: 'Keep components small and focused on a single responsibility.' },
  { course: 'react', chapter: 'React Fundamentals', title: 'Props',
    content: '<h2>React Props</h2><p>Props (properties) pass data from parent to child components. They are read-only — never mutate props.</p>',
    example: 'function Card({ title, description, color = "blue" }) {\n  return (\n    <div style={{ borderColor: color }}>\n      <h2>{title}</h2>\n      <p>{description}</p>\n    </div>\n  );\n}',
    output: 'A card component displaying title and description with a colored border.',
    tips: 'Use default parameter values in destructuring for optional props.' },
  { course: 'react', chapter: 'State & Hooks', title: 'useState',
    content: '<h2>useState Hook</h2><p>useState adds state to functional components. Returns the current state value and a setter function.</p>',
    example: 'function Counter() {\n  const [count, setCount] = useState(0);\n  return (\n    <div>\n      <p>Count: {count}</p>\n      <button onClick={() => setCount(c => c + 1)}>+</button>\n    </div>\n  );\n}',
    output: 'A counter that increments on button click.',
    tips: 'Pass a function to the setter (setCount(c => c + 1)) when new state depends on old state.' },
  { course: 'react', chapter: 'State & Hooks', title: 'useEffect',
    content: '<h2>useEffect Hook</h2><p>useEffect lets you perform side effects (data fetching, subscriptions, DOM mutations) in functional components.</p>',
    example: 'function UserProfile({ userId }) {\n  const [user, setUser] = useState(null);\n\n  useEffect(() => {\n    fetch(`/api/users/${userId}`)\n      .then(r => r.json())\n      .then(setUser);\n  }, [userId]); // re-run when userId changes\n\n  return <div>{user?.name}</div>;\n}',
    output: 'Fetches and displays user name whenever userId changes.',
    tips: 'Return a cleanup function from useEffect to cancel subscriptions and timers.' },
  { course: 'react', chapter: 'State & Hooks', title: 'Custom Hooks',
    content: '<h2>Custom Hooks</h2><p>Extract reusable stateful logic into custom hooks. Must start with "use".</p>',
    example: 'function useWindowWidth() {\n  const [width, setWidth] = useState(window.innerWidth);\n\n  useEffect(() => {\n    const handler = () => setWidth(window.innerWidth);\n    window.addEventListener("resize", handler);\n    return () => window.removeEventListener("resize", handler);\n  }, []);\n\n  return width;\n}',
    output: 'A hook that returns current window width, updates on resize.',
    tips: 'Custom hooks allow you to share logic between components without changing the component hierarchy.' },
  { course: 'react', chapter: 'Routing', title: 'React Router',
    content: '<h2>React Router</h2><p>React Router DOM enables client-side routing. Wrap the app in BrowserRouter and define routes with Routes and Route.</p>',
    example: 'import { BrowserRouter, Routes, Route } from "react-router-dom";\n\nfunction App() {\n  return (\n    <BrowserRouter>\n      <Routes>\n        <Route path="/" element={<Home />} />\n        <Route path="/about" element={<About />} />\n      </Routes>\n    </BrowserRouter>\n  );\n}',
    output: 'Single-page app with two routes.',
    tips: 'Use Layout routes (nested Routes) to share headers/footers across pages.' },
  { course: 'react', chapter: 'Routing', title: 'Navigation',
    content: '<h2>Navigation in React Router</h2><p>Use Link for declarative navigation and useNavigate for programmatic navigation.</p>',
    example: 'import { Link, useNavigate } from "react-router-dom";\n\nfunction Nav() {\n  const navigate = useNavigate();\n  return (\n    <nav>\n      <Link to="/">Home</Link>\n      <button onClick={() => navigate("/login")}>Login</button>\n    </nav>\n  );\n}',
    output: 'Nav with a link and a programmatic navigation button.',
    tips: 'Use Link instead of <a> to prevent page reloads in React Router apps.' },
  { course: 'react', chapter: 'Routing', title: 'Params',
    content: '<h2>Route Parameters</h2><p>Dynamic segments in routes are URL parameters. Read them with useParams.</p>',
    example: '// Route definition\n<Route path="/users/:id" element={<UserPage />} />\n\n// Inside UserPage\nimport { useParams } from "react-router-dom";\nfunction UserPage() {\n  const { id } = useParams();\n  return <p>User ID: {id}</p>;\n}',
    output: 'Displays the user ID from the URL.',
    tips: 'Use useSearchParams to read and update query string parameters (?key=value).' },
  { course: 'react', chapter: 'State Management', title: 'Context API',
    content: '<h2>Context API</h2><p>Context provides a way to share data globally without prop drilling. Use createContext, Provider, and useContext.</p>',
    example: 'const ThemeContext = createContext("light");\n\nfunction App() {\n  return (\n    <ThemeContext.Provider value="dark">\n      <ThemedButton />\n    </ThemeContext.Provider>\n  );\n}\n\nfunction ThemedButton() {\n  const theme = useContext(ThemeContext);\n  return <button className={theme}>Click</button>;\n}',
    output: 'Button uses the dark theme from Context.',
    tips: 'Split contexts by domain (UserContext, ThemeContext) to prevent unnecessary re-renders.' },
  { course: 'react', chapter: 'State Management', title: 'useReducer',
    content: '<h2>useReducer Hook</h2><p>useReducer is better than useState for complex state logic with multiple sub-values or when the next state depends on the previous one.</p>',
    example: 'function reducer(state, action) {\n  switch (action.type) {\n    case "increment": return { count: state.count + 1 };\n    case "decrement": return { count: state.count - 1 };\n    default: return state;\n  }\n}\n\nconst [state, dispatch] = useReducer(reducer, { count: 0 });',
    output: 'State managed with a reducer pattern.',
    tips: 'Think of useReducer as a local Redux — great for forms and complex UI state.' },
  { course: 'react', chapter: 'State Management', title: 'Redux',
    content: '<h2>Redux</h2><p>Redux is a predictable state container for JavaScript. Use @reduxjs/toolkit (RTK) for modern Redux — no boilerplate.</p>',
    example: 'import { createSlice } from "@reduxjs/toolkit";\n\nconst counterSlice = createSlice({\n  name: "counter",\n  initialState: { value: 0 },\n  reducers: {\n    increment: state => { state.value++ },\n  }\n});\nexport const { increment } = counterSlice.actions;',
    output: 'A Redux slice with an increment action.',
    tips: 'Use RTK Query (built into @reduxjs/toolkit) for server state instead of fetching manually.' },
  { course: 'react', chapter: 'Performance', title: 'useMemo',
    content: '<h2>useMemo Hook</h2><p>useMemo memoizes the result of an expensive computation, recomputing only when dependencies change.</p>',
    example: 'const sortedList = useMemo(() => {\n  console.log("sorting...");\n  return [...unsortedList].sort((a, b) => a - b);\n}, [unsortedList]);',
    output: '"sorting..." logged only when unsortedList changes, not on every render.',
    tips: 'Only use useMemo for genuinely expensive operations — premature optimization can slow things down.' },
  { course: 'react', chapter: 'Performance', title: 'useCallback',
    content: '<h2>useCallback Hook</h2><p>useCallback memoizes a function reference, preventing child components from re-rendering unnecessarily.</p>',
    example: 'const handleClick = useCallback((id) => {\n  onItemSelect(id);\n}, [onItemSelect]);\n\n// Pass to child without causing re-renders\n<ItemList onSelect={handleClick} />',
    output: 'ItemList only re-renders when onItemSelect changes.',
    tips: 'Pair useCallback with React.memo on child components for the best effect.' },
  { course: 'react', chapter: 'Performance', title: 'Lazy Loading',
    content: '<h2>Lazy Loading</h2><p>Split your bundle and load components only when needed using React.lazy and Suspense.</p>',
    example: 'import { lazy, Suspense } from "react";\n\nconst Dashboard = lazy(() => import("./Dashboard"));\n\nfunction App() {\n  return (\n    <Suspense fallback={<div>Loading...</div>}>\n      <Dashboard />\n    </Suspense>\n  );\n}',
    output: 'Dashboard component loads only when it is needed.',
    tips: 'Lazy load heavy pages/modals to dramatically improve initial load time.' },
];

// ── Score how "rich" a lesson is based on total content length ─────────────────
// The lesson with the HIGHER score = MORE information = should be KEPT
function richnessScore(lesson) {
  const content  = (lesson.content  || '').length;
  const example  = (lesson.example  || '').length;
  const output   = (lesson.output   || '').length;
  const tips     = (lesson.tips     || '').length;
  return content + example + output + tips;
}

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB.\n');

    let inserted = 0;
    let updated  = 0;
    let skipped  = 0;
    let removed  = 0;

    for (const newLesson of CLEAN_LESSONS) {
      // Find ALL existing lessons with same course + title (duplicates)
      const existing = await Lesson.find({
        course: new RegExp(`^${newLesson.course}$`, 'i'),
        title:  new RegExp(`^${newLesson.title}$`,  'i'),
      });

      if (existing.length === 0) {
        // No duplicate — just insert fresh
        await Lesson.create(newLesson);
        console.log(`  ✅ INSERTED: [${newLesson.course}] "${newLesson.title}"`);
        inserted++;

      } else if (existing.length === 1) {
        const dbLesson   = existing[0];
        const dbScore    = richnessScore(dbLesson);
        const newScore   = richnessScore(newLesson);

        if (newScore > dbScore) {
          // New lesson has MORE info — update the DB record
          await Lesson.findByIdAndUpdate(dbLesson._id, {
            $set: {
              content: newLesson.content,
              example: newLesson.example,
              output:  newLesson.output,
              tips:    newLesson.tips,
              chapter: newLesson.chapter, // fix chapter name too
            }
          });
          console.log(`  🔄 UPDATED (richer): [${newLesson.course}] "${newLesson.title}" (DB: ${dbScore} → New: ${newScore} chars)`);
          updated++;
        } else {
          // DB lesson already has MORE or EQUAL info — keep it, skip
          console.log(`  ⏭️  SKIPPED (DB richer): [${newLesson.course}] "${newLesson.title}" (DB: ${dbScore} ≥ New: ${newScore} chars)`);
          skipped++;
        }

      } else {
        // Multiple duplicates found — keep the richest ONE, delete the rest
        console.log(`  ⚠️  DUPLICATES (${existing.length}) found: [${newLesson.course}] "${newLesson.title}"`);

        // Score all existing + the new one together
        const allCandidates = [
          ...existing.map(doc => ({ doc, score: richnessScore(doc), isDb: true })),
          { doc: newLesson, score: richnessScore(newLesson), isDb: false },
        ];

        // Sort descending — richest first
        allCandidates.sort((a, b) => b.score - a.score);
        const winner = allCandidates[0];

        // Update the first DB record with the winner's content
        const keepId = existing[0]._id;
        await Lesson.findByIdAndUpdate(keepId, {
          $set: {
            content: winner.doc.content || winner.doc.content,
            example: winner.doc.example,
            output:  winner.doc.output,
            tips:    winner.doc.tips,
            chapter: newLesson.chapter, // always use correct chapter name
          }
        });
        console.log(`    🏆 Kept richest (${winner.score} chars, ${winner.isDb ? 'from DB' : 'from script'})`);

        // Delete all other duplicates
        const idsToDelete = existing.slice(1).map(d => d._id);
        if (idsToDelete.length > 0) {
          await Lesson.deleteMany({ _id: { $in: idsToDelete } });
          console.log(`    🗑️  Deleted ${idsToDelete.length} weaker duplicate(s)`);
          removed += idsToDelete.length;
        }
        updated++;
      }
    }

    // ── Final summary ─────────────────────────────────────────────────────────
    console.log('\n════════════════════════════════════════');
    console.log('✅ DONE!');
    console.log(`   Inserted : ${inserted}`);
    console.log(`   Updated  : ${updated}  (richer version kept)`);
    console.log(`   Skipped  : ${skipped}  (DB already had richer data)`);
    console.log(`   Deleted  : ${removed}  (weaker duplicates removed)`);
    console.log('════════════════════════════════════════\n');

    // ── Verify final count ────────────────────────────────────────────────────
    const grouped = await Lesson.aggregate([
      { $group: { _id: '$course', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    console.log('Final lesson count per course:');
    grouped.forEach(g => console.log(`  ${g._id}: ${g.count} lessons`));
  })
  .catch(console.error)
  .finally(() => process.exit());


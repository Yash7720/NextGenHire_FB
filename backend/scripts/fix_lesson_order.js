const mongoose = require('mongoose');
const Lesson = require('../models/Lesson');
require('dotenv').config();

// Canonical order from frontend/src/data/index.js
const COURSE_MAPPING = {
  html: {
    'Introduction to HTML': ['What is HTML?', 'Document Structure', 'Tags & Elements'],
    'Text & Formatting': ['Headings & Paragraphs', 'Lists', 'Bold & Italic'],
    'Links & Images': ['Anchor Tags', 'Image Tags', 'Attributes'],
    'Forms & Input': ['Form Element', 'Input Types', 'Labels & Buttons'],
    'Semantic HTML': ['Header/Footer', 'Article/Section', 'Accessibility']
  },
  css: {
    'CSS Basics': ['Selectors', 'Properties', 'Values'],
    'Box Model': ['Margin & Padding', 'Border', 'Width/Height'],
    'Flexbox': ['Flex Container', 'Flex Items', 'Alignment'],
    'Grid Layout': ['Grid Template', 'Grid Areas', 'Auto-fit/fill'],
    'Animations': ['Transitions', 'Keyframes', 'Transform']
  },
  javascript: { // Mapper handles 'js' -> 'javascript' in backend
    'JS Fundamentals': ['Variables', 'Data Types', 'Operators'],
    'Functions': ['Declaration', 'Arrow Functions', 'Closures'],
    'DOM Manipulation': ['querySelector', 'Events', 'Dynamic Content'],
    'Async JavaScript': ['Promises', 'Async/Await', 'Fetch API'],
    'ES6+ Features': ['Destructuring', 'Spread/Rest', 'Modules']
  },
  python: {
    'Python Basics': ['Syntax', 'Variables', 'Print'],
    'Control Flow': ['if/else', 'for loops', 'while loops'],
    'Functions': ['def', 'Parameters', 'Return Values'],
    'Data Structures': ['Lists', 'Dicts', 'Tuples'],
    'OOP': ['Classes', 'Inheritance', 'Methods']
  },
  'c++': { // Mapper handles 'cpp' -> 'c++'
    'CPP Basics': ['Syntax', 'Data Types', 'I/O'],
    'Pointers & Memory': ['Pointers', 'References', 'Dynamic Allocation'],
    'OOP in CPP': ['Classes', 'Constructors', 'Polymorphism'],
    'STL': ['Vectors', 'Maps', 'Algorithms'],
    'Templates': ['Function Templates', 'Class Templates', 'Metaprogramming']
  },
  react: {
    'React Fundamentals': ['JSX', 'Components', 'Props'],
    'State & Hooks': ['useState', 'useEffect', 'Custom Hooks'],
    'Routing': ['React Router', 'Navigation', 'Params'],
    'State Management': ['Context API', 'useReducer', 'Redux'],
    'Performance': ['useMemo', 'useCallback', 'Lazy Loading']
  }
};

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    let updatedCount = 0;
    const lessons = await Lesson.find({});
    console.log(`Processing ${lessons.length} lessons...`);

    for (const lesson of lessons) {
      const courseKey = lesson.course.toLowerCase();
      const courseData = COURSE_MAPPING[courseKey];

      if (courseData) {
        const chapterSubs = courseData[lesson.chapter];
        if (chapterSubs) {
          const orderIndex = chapterSubs.indexOf(lesson.title);
          if (orderIndex !== -1) {
            lesson.order = orderIndex + 1; // 1-based indexing
            await lesson.save();
            updatedCount++;
            console.log(`Updated [${lesson.course}] > [${lesson.chapter}] > ${lesson.title} : Order ${lesson.order}`);
          } else {
            console.warn(`Title mismatch: "${lesson.title}" not found in chapter "${lesson.chapter}" for course "${lesson.course}"`);
          }
        } else {
          console.warn(`Chapter mismatch: "${lesson.chapter}" not found for course "${lesson.course}"`);
        }
      } else {
        console.warn(`Course mismatch: "${lesson.course}" not found in mapping`);
      }
    }

    console.log(`Migration complete. Updated ${updatedCount} lessons.`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();

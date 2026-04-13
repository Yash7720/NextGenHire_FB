// ── Courses ────────────────────────────────────────────────────────────────────
export const COURSES = [
  {
    id: 'html', title: 'HTML Fundamentals', icon: '🌐', color: '#e34c26',
    level: 'Beginner', xp: 150,
    chapters: [
      { id: 1, title: 'Introduction to HTML',   subs: ['What is HTML?', 'Document Structure', 'Tags & Elements'] },
      { id: 2, title: 'Text & Formatting',       subs: ['Headings & Paragraphs', 'Lists', 'Bold & Italic'] },
      { id: 3, title: 'Links & Images',          subs: ['Anchor Tags', 'Image Tags', 'Attributes'] },
      { id: 4, title: 'Forms & Input',           subs: ['Form Element', 'Input Types', 'Labels & Buttons'] },
      { id: 5, title: 'Semantic HTML',           subs: ['Header/Footer', 'Article/Section', 'Accessibility'] },
    ],
    description: 'Learn the building blocks of the web from scratch. Master semantic markup and modern HTML5 features.',
  },
  {
    id: 'css', title: 'CSS Mastery', icon: '🎨', color: '#264de4',
    level: 'Beginner', xp: 200,
    chapters: [
      { id: 1, title: 'CSS Basics',     subs: ['Selectors', 'Properties', 'Values'] },
      { id: 2, title: 'Box Model',      subs: ['Margin & Padding', 'Border', 'Width/Height'] },
      { id: 3, title: 'Flexbox',        subs: ['Flex Container', 'Flex Items', 'Alignment'] },
      { id: 4, title: 'Grid Layout',    subs: ['Grid Template', 'Grid Areas', 'Auto-fit/fill'] },
      { id: 5, title: 'Animations',     subs: ['Transitions', 'Keyframes', 'Transform'] },
    ],
    description: 'Style the web beautifully. Master layouts, responsive design, and stunning visual effects.',
  },
  {
    id: 'js', title: 'JavaScript', icon: '⚡', color: '#f7df1e',
    level: 'Intermediate', xp: 300,
    chapters: [
      { id: 1, title: 'JS Fundamentals',  subs: ['Variables', 'Data Types', 'Operators'] },
      { id: 2, title: 'Functions',         subs: ['Declaration', 'Arrow Functions', 'Closures'] },
      { id: 3, title: 'DOM Manipulation',  subs: ['querySelector', 'Events', 'Dynamic Content'] },
      { id: 4, title: 'Async JavaScript',  subs: ['Promises', 'Async/Await', 'Fetch API'] },
      { id: 5, title: 'ES6+ Features',     subs: ['Destructuring', 'Spread/Rest', 'Modules'] },
    ],
    description: 'Bring websites to life. Learn the language of the browser and build interactive experiences.',
  },
  {
    id: 'python', title: 'Python', icon: '🐍', color: '#3776ab',
    level: 'Beginner', xp: 280,
    chapters: [
      { id: 1, title: 'Python Basics',      subs: ['Syntax', 'Variables', 'Print'] },
      { id: 2, title: 'Control Flow',        subs: ['if/else', 'for loops', 'while loops'] },
      { id: 3, title: 'Functions',           subs: ['def', 'Parameters', 'Return Values'] },
      { id: 4, title: 'Data Structures',     subs: ['Lists', 'Dicts', 'Tuples'] },
      { id: 5, title: 'OOP',                 subs: ['Classes', 'Inheritance', 'Methods'] },
    ],
    description: 'The most versatile language on earth. From scripting to AI — Python does it all.',
  },
  {
    id: 'cpp', title: 'C++', icon: '⚙️', color: '#00599c',
    level: 'Advanced', xp: 400,
    chapters: [
      { id: 1, title: 'C++ Basics',         subs: ['Syntax', 'Data Types', 'I/O'] },
      { id: 2, title: 'Pointers & Memory',   subs: ['Pointers', 'References', 'Dynamic Allocation'] },
      { id: 3, title: 'OOP in C++',          subs: ['Classes', 'Constructors', 'Polymorphism'] },
      { id: 4, title: 'STL',                 subs: ['Vectors', 'Maps', 'Algorithms'] },
      { id: 5, title: 'Templates',           subs: ['Function Templates', 'Class Templates', 'Metaprogramming'] },
    ],
    description: 'Master systems programming. Build high-performance apps, games, and OS-level software.',
  },
  {
    id: 'react', title: 'React', icon: '⚛️', color: '#61dafb',
    level: 'Intermediate', xp: 350,
    chapters: [
      { id: 1, title: 'React Fundamentals',  subs: ['JSX', 'Components', 'Props'] },
      { id: 2, title: 'State & Hooks',        subs: ['useState', 'useEffect', 'Custom Hooks'] },
      { id: 3, title: 'Routing',              subs: ['React Router', 'Navigation', 'Params'] },
      { id: 4, title: 'State Management',     subs: ['Context API', 'useReducer', 'Redux'] },
      { id: 5, title: 'Performance',          subs: ['useMemo', 'useCallback', 'Lazy Loading'] },
    ],
    description: 'Build modern UIs with the world\'s most popular frontend library.',
  },
]

// ── Jobs ───────────────────────────────────────────────────────────────────────
export const JOBS = [
  { id: 1, title: 'Frontend Developer',  company: 'TechCorp',   type: 'Full-time', level: 'Mid',    skills: ['React', 'CSS', 'JS'],         salary: '₹8–12 LPA',  deadline: 'Mar 15', applicants: 42, logo: '🏢' },
  { id: 2, title: 'Python Engineer',     company: 'DataFlow',   type: 'Remote',    level: 'Junior', skills: ['Python', 'Django'],           salary: '₹6–9 LPA',   deadline: 'Mar 20', applicants: 38, logo: '🚀' },
  { id: 3, title: 'Full Stack Dev',      company: 'StartupXYZ', type: 'Hybrid',    level: 'Senior', skills: ['React', 'Node', 'Python'],    salary: '₹15–22 LPA', deadline: 'Mar 10', applicants: 65, logo: '💡' },
  { id: 4, title: 'C++ Developer',       company: 'GameStudio', type: 'On-site',   level: 'Mid',    skills: ['C++', 'OpenGL'],             salary: '₹10–15 LPA', deadline: 'Mar 25', applicants: 28, logo: '🎮' },
  { id: 5, title: 'UI/UX Developer',     company: 'DesignHub',  type: 'Remote',    level: 'Junior', skills: ['HTML', 'CSS', 'Figma'],      salary: '₹5–8 LPA',   deadline: 'Apr 1',  applicants: 55, logo: '🎨' },
  { id: 6, title: 'DevOps Engineer',     company: 'CloudBase',  type: 'Remote',    level: 'Mid',    skills: ['Docker', 'AWS', 'CI/CD'],    salary: '₹12–18 LPA', deadline: 'Apr 5',  applicants: 33, logo: '☁️' },
]

// ── Achievements ───────────────────────────────────────────────────────────────
export const ACHIEVEMENTS = [
  { id: 1,  icon: '🔥', title: 'First Blood',    desc: 'Complete your first chapter',       rarity: 'common',    xp: 10  },
  { id: 2,  icon: '⚡', title: 'Speed Runner',   desc: 'Complete 3 chapters in a day',      rarity: 'rare',      xp: 30  },
  { id: 3,  icon: '🎯', title: 'Sharpshooter',   desc: 'Score 100% on any quiz',            rarity: 'epic',      xp: 75  },
  { id: 4,  icon: '👑', title: 'Course Master',  desc: 'Complete a full course',            rarity: 'legendary', xp: 200 },
  { id: 5,  icon: '🌟', title: 'Star Student',   desc: 'Top 10 on leaderboard',             rarity: 'epic',      xp: 100 },
  { id: 6,  icon: '🏗️', title: 'Builder',        desc: 'Submit first mini project',         rarity: 'rare',      xp: 50  },
  { id: 7,  icon: '🔮', title: 'Polyglot',        desc: 'Enroll in 3+ courses',              rarity: 'rare',      xp: 40  },
  { id: 8,  icon: '💎', title: 'Diamond Coder',   desc: 'Reach 1000 XP',                     rarity: 'legendary', xp: 150 },
  { id: 9,  icon: '🎪', title: '7-Day Streak',    desc: 'Study 7 days in a row',             rarity: 'epic',      xp: 80  },
  { id: 10, icon: '🤖', title: 'AI Scholar',      desc: 'Use AI hints 10 times',             rarity: 'common',    xp: 20  },
  { id: 11, icon: '🧩', title: 'Puzzle Solver',   desc: 'Complete 5 mini projects',          rarity: 'epic',      xp: 120 },
  { id: 12, icon: '🚀', title: 'Rocketeer',       desc: 'Apply to 3 jobs',                   rarity: 'rare',      xp: 60  },
]

export const RARITY_COLORS = {
  common:    '#94a3b8',
  rare:      '#3b82f6',
  epic:      '#8b5cf6',
  legendary: '#ffd700',
}

// ── Daily Quests ───────────────────────────────────────────────────────────────
export const DAILY_QUESTS = [
  { id: 1, icon: '📖', title: 'Study Session',   desc: 'Complete 2 sub-chapters',             xp: 20, max: 2,  progress: 1 },
  { id: 2, icon: '⚔️', title: 'Quiz Warrior',    desc: 'Answer 10 quiz questions',            xp: 30, max: 10, progress: 7 },
  { id: 3, icon: '🔥', title: 'Keep the Streak', desc: 'Login today',                         xp: 10, max: 1,  progress: 1 },
  { id: 4, icon: '🎯', title: 'Accuracy Shot',   desc: 'Get 5 correct answers in a row',      xp: 25, max: 5,  progress: 3 },
]

export const WEEKLY_CHALLENGES = [
  { id: 1, icon: '🏋️', title: 'Iron Will',    desc: 'Complete 10 chapters this week',  xp: 100, max: 10, progress: 6, rarity: 'epic'      },
  { id: 2, icon: '⚡', title: 'Speed Demon',  desc: 'Complete a course in under 24h',  xp: 200, max: 1,  progress: 0, rarity: 'legendary' },
  { id: 3, icon: '🎯', title: 'Perfect Score', desc: 'Score 100% on any quiz',          xp: 150, max: 1,  progress: 0, rarity: 'epic'      },
  { id: 4, icon: '🤝', title: 'Social Coder',  desc: 'Share progress 3 times',          xp: 60,  max: 3,  progress: 2, rarity: 'rare'      },
]

// ── Leaderboard ────────────────────────────────────────────────────────────────
export const LEADERBOARD = [
  { rank: 1, name: 'AyushS',  avatar: '🧑‍💻', xp: 4820, courses: 5, badge: 'Diamond',  streak: 45 },
  { rank: 2, name: 'PriyaK',  avatar: '👩‍💻', xp: 4510, courses: 4, badge: 'Platinum', streak: 32 },
  { rank: 3, name: 'RajD',    avatar: '🧑‍🔬', xp: 4200, courses: 4, badge: 'Platinum', streak: 28 },
  { rank: 4, name: 'SnehaM',  avatar: '👩‍🎓', xp: 3890, courses: 3, badge: 'Gold',     streak: 21 },
  { rank: 5, name: 'ArjunV',  avatar: '🧑‍🎓', xp: 3540, courses: 3, badge: 'Gold',     streak: 18 },
  { rank: 6, name: 'You',     avatar: '⭐',   xp: 1250, courses: 2, badge: 'Silver',   streak: 7,  isYou: true },
]

// ── Admin Candidates ───────────────────────────────────────────────────────────
export const ADMIN_CANDIDATES = [
  { name: 'Ayush S.',  score: 95, skills: ['React', 'JS', 'CSS'],    applied: 'Frontend Dev', status: 'shortlisted', xp: 4820 },
  { name: 'Priya K.',  score: 92, skills: ['Python', 'Django'],       applied: 'Python Eng.',  status: 'interview',   xp: 4510 },
  { name: 'Raj D.',    score: 88, skills: ['C++', 'OpenGL'],          applied: 'C++ Dev',      status: 'pending',     xp: 4200 },
  { name: 'Sneha M.',  score: 84, skills: ['HTML', 'CSS', 'Figma'],  applied: 'UI/UX Dev',    status: 'pending',     xp: 3890 },
  { name: 'Arjun V.',  score: 79, skills: ['React', 'Node'],          applied: 'Full Stack',   status: 'rejected',    xp: 3540 },
  { name: 'Meera T.',  score: 74, skills: ['Python', 'ML'],           applied: 'Python Eng.',  status: 'pending',     xp: 3100 },
]

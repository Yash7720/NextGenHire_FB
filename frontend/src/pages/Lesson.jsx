import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { getLessonsByCourseAndChapter } from '../services/lessonApi';
import ProgressBar from '../components/ui/ProgressBar';
import { useOutletContext } from 'react-router-dom';
import CodeCompiler from '../components/ui/CodeCompiler';

export default function Lesson() {
  const { course, chapter } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { enroll, markLessonAsViewed } = useOutletContext();
  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        setLoading(true);
        setErrorMsg('');
        
        let mappedCourse = course;
        if (mappedCourse === 'js') mappedCourse = 'javascript';
        if (mappedCourse === 'cpp') mappedCourse = 'c++';

        const data = await getLessonsByCourseAndChapter(mappedCourse, chapter);
        setLessons(data);
        if (data && data.length > 0) {
          const initialLessonTitle = searchParams.get('lesson');
          const found = data.find(l => l.title === initialLessonTitle);
          setSelectedLesson(found || data[0]);
        }
      } catch (error) {
        console.error("Failed to fetch lessons:", error);
        setErrorMsg(error.message || "Failed to load lessons from server.");
      } finally {
        setLoading(false);
      }
    };
    fetchLessons();

    // Auto-enroll when viewing the lesson
    if (course) {
      enroll(course);
    }
  }, [course, chapter, enroll]);

  useEffect(() => {
    if (selectedLesson) {
      markLessonAsViewed(course, chapter, selectedLesson.title)
    }
  }, [selectedLesson, course, chapter, markLessonAsViewed]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10 h-full">
        <div className="font-orbitron animate-pulse text-cyan">Loading Lessons...</div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="flex items-center justify-center p-10 h-full">
        <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-xl max-w-lg text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="font-orbitron text-red-400 mb-2">Connection Error</h2>
          <p className="text-slate-300 text-sm">{errorMsg}</p>
          <div className="mt-6 text-left bg-black/30 p-4 rounded-lg text-xs text-slate-400 font-mono">
            <strong>Hint:</strong> If you recently changed Wi-Fi networks or moved to a hotspot, your new network IP was blocked by MongoDB Atlas. <br/><br/>
            Go to MongoDB Atlas → Network Access → Add IP Address → "Allow Access From Anywhere" (0.0.0.0/0). Then <b>Restart your backend server.</b>
          </div>
        </div>
      </div>
    );
  }

  if (!lessons.length) {
    return (
      <div className="flex items-center justify-center p-10 h-full">
        <div className="font-orbitron text-slate-500">No lessons found.</div>
      </div>
    );
  }

  const currentIndex = lessons.findIndex((l) => l._id === selectedLesson?._id);

  const handleNext = () => {
    if (currentIndex < lessons.length - 1) {
      setSelectedLesson(lessons[currentIndex + 1]);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setSelectedLesson(lessons[currentIndex - 1]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-2 rounded-xl overflow-hidden glass border-cyan/20 border">
      <div className="flex gap-0 h-full min-h-[75vh]">
        {/* Sidebar */}
        <div className="w-1/4 min-w-[250px] border-r border-border bg-bg-3/50 flex flex-col">
          <div className="p-4 border-b border-border bg-panel-2 sticky top-0 flex flex-col gap-2">
            <button 
              onClick={() => navigate(`/app/courses?courseId=${course}`)} 
              className="self-start text-xs font-medium text-slate-400 hover:text-cyan py-1 px-2 -ml-2 rounded-md hover:bg-cyan/10 transition-colors flex items-center gap-1"
            >
              ← Back
            </button>
            <h2 className="font-orbitron text-sm tracking-widest text-slate-200 uppercase truncate" title={chapter}>{chapter}</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {lessons.map((lesson, idx) => {
              const isActive = selectedLesson && selectedLesson._id === lesson._id;
              return (
                <button
                  key={lesson._id}
                  onClick={() => setSelectedLesson(lesson)}
                  className={`w-full text-left px-5 py-3 text-sm font-medium transition-colors border-l-4 ${
                    isActive 
                      ? 'border-cyan bg-cyan/10 text-cyan' 
                      : 'border-transparent text-slate-400 hover:bg-panel hover:text-slate-200'
                  }`}
                >
                  <span className="opacity-50 mr-2 text-[10px]">{idx + 1}.</span> {lesson.title}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto flex flex-col relative bg-bg/50">
          <div className="flex-1 p-8 pb-32 max-w-4xl mx-auto w-full">
            <h1 className="text-3xl font-orbitron text-cyan mb-6">{selectedLesson.title}</h1>
            
            {/* HTML Content */}
            <div 
              className="prose prose-invert prose-cyan max-w-none mb-8 text-slate-300 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: selectedLesson.content }} 
            />

            {/* Example Block */}
            {selectedLesson.example && (
              <div className="mb-8">
                <h3 className="font-orbitron text-sm text-gold mb-3">EXAMPLE</h3>
                <div className="bg-[#0f1628] rounded-xl border border-border p-4 relative font-mono text-sm overflow-x-auto text-green-400">
                  <pre className="whitespace-pre-wrap m-0">
                    {selectedLesson.example}
                  </pre>
                </div>
              </div>
            )}

            {/* Output Block */}
            {selectedLesson.output && (
              <div className="mb-8">
                <h3 className="font-orbitron text-[10px] tracking-widest text-slate-500 mb-3 uppercase">Expected Output</h3>
                <div className="bg-bg-3/50 rounded-xl border border-border/50 p-4 font-mono text-sm text-slate-300">
                  <pre className="whitespace-pre-wrap m-0">
                    {selectedLesson.output}
                  </pre>
                </div>
              </div>
            )}

            {/* Tips Block */}
            {selectedLesson.tips && (
              <div className="bg-cyan/5 border-l-4 border-cyan p-4 rounded-r-lg mb-8">
                <div className="flex gap-3">
                  <span className="text-cyan text-xl">💡</span>
                  <div>
                    <h4 className="font-bold text-cyan text-sm mb-1 uppercase tracking-wider font-orbitron">Pro Tip</h4>
                    <p className="text-slate-300 text-sm">{selectedLesson.tips}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Interactive Compiler */}
            <div className="mb-8 mt-12 animate-fade-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">💻</span>
                <div>
                  <h3 className="font-orbitron text-lg text-cyan mb-0 tracking-widest">CODE PLAYGROUND</h3>
                  <p className="text-xs text-slate-400 m-0">Practice writing your own code or try the examples!</p>
                </div>
              </div>
              <CodeCompiler 
                defaultLanguage={course} 
                defaultCode={
                  course === 'css' && selectedLesson.example && !selectedLesson.example.includes('<style')
                    ? `<!DOCTYPE html>\n<html>\n<body>\n  <!-- HTML Elements to style -->\n  <div id="main-content">\n    <h2 class="highlight">Hello CSS!</h2>\n    <p>Edit this HTML and the CSS below to see changes.</p>\n  </div>\n  <section>\n    <h2>Section Title</h2>\n  </section>\n\n  <style>\n${selectedLesson.example}\n  </style>\n</body>\n</html>`
                    : selectedLesson.example || ''
                } 
              />
            </div>
          </div>

          {/* Navigation Bottom Footer */}
          <div className="sticky bottom-0 bg-panel border-t border-border p-4 flex justify-between items-center z-10 w-full mt-auto">
            <button 
              className="btn btn-sm btn-outline border-slate-600 text-slate-300 hover:border-slate-400 disabled:opacity-30 disabled:cursor-not-allowed"
              onClick={handlePrev}
              disabled={currentIndex <= 0}
            >
              ← Previous
            </button>
            <div className="text-xs font-orbitron text-slate-500">
              {currentIndex + 1} OF {lessons.length}
            </div>
            <button 
              className="btn btn-sm btn-cyan disabled:opacity-30 disabled:cursor-not-allowed"
              onClick={handleNext}
              disabled={currentIndex >= lessons.length - 1}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

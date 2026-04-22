import { useState, useEffect, useRef } from 'react'
import { useOutletContext, useNavigate, useSearchParams } from 'react-router-dom'
import ProgressBar from '../components/ui/ProgressBar'
import Modal from '../components/ui/Modal'
import { COURSES } from '../data'
import { submitProject } from '../services/projectApi'
import * as userApi from '../services/userApi'

// ── Quiz questions per course ─────────────────────────────────────────────────
const QUIZ_QUESTIONS = {
  html: [
    { q: 'What does HTML stand for?', opts: ['Hyper Text Markup Language', 'High Tech Modern Language', 'Hyper Transfer Markup Language', 'Hyper Text Modern Link'], ans: 0 },
    { q: 'Which tag is used for the largest heading?', opts: ['<h6>', '<head>', '<h1>', '<title>'], ans: 2 },
    { q: 'What is the correct HTML for a line break?', opts: ['<lb>', '<break>', '<br>', '<newline>'], ans: 2 },
    { q: 'Which attribute provides a unique identifier for an element?', opts: ['class', 'id', 'name', 'key'], ans: 1 },
    { q: 'What is the purpose of the <img> alt attribute?', opts: ['Link source', 'Image size', 'Alternative text', 'Border style'], ans: 2 },
    { q: 'Which tag is used to create an unordered list?', opts: ['<ol>', '<li>', '<ul>', '<list>'], ans: 2 },
    { q: 'Which HTML element defines the title of a document?', opts: ['<header>', '<meta>', '<title>', '<body>'], ans: 2 },
    { q: 'Which attribute opens a link in a new tab?', opts: ['target="_blank"', 'rel="new"', 'href="_new"', 'window="new"'], ans: 0 },
    { q: 'Which tag defines a multiline input field?', opts: ['<input type="text">', '<textarea>', '<textbox>', '<field>'], ans: 1 },
    { q: 'Which semantic tag represents the main content?', opts: ['<section>', '<article>', '<main>', '<div>'], ans: 2 },
  ],
  css: [
    { q: 'What does CSS stand for?', opts: ['Computer Style Sheets', 'Cascading Style Sheets', 'Creative Style Syntax', 'Colorful Style Sheets'], ans: 1 },
    { q: 'Which property is used to change background color?', opts: ['bgcolor', 'background-color', 'color', 'fill'], ans: 1 },
    { q: 'How do you select an element with id "header"?', opts: ['.header', '#header', 'header', '*header'], ans: 1 },
    { q: 'Which property is used to change font size?', opts: ['text-size', 'font-style', 'font-size', 'size'], ans: 2 },
    { q: 'What is the default value of the position property?', opts: ['relative', 'absolute', 'fixed', 'static'], ans: 3 },
    { q: 'Which property controls the space inside a border?', opts: ['margin', 'padding', 'spacing', 'gap'], ans: 1 },
    { q: 'How do you remove bullets from a list?', opts: ['list-style: none', 'bullet: hidden', 'text-decoration: none', 'list-type: clean'], ans: 0 },
    { q: 'Which Flexbox property aligns items along the main axis?', opts: ['align-items', 'align-content', 'justify-content', 'flex-direction'], ans: 2 },
    { q: 'Which property creates a grid container?', opts: ['display: flex', 'display: grid', 'grid-template: container', 'layout: grid'], ans: 1 },
    { q: 'What does the z-index property control?', opts: ['Font weight', 'Element transparency', 'Vertical stacking order', 'Horizontal alignment'], ans: 2 },
  ],
  js: [
    { q: 'Which keyword declares a variable that can be reassigned?', opts: ['var', 'let', 'const', 'static'], ans: 1 },
    { q: 'What is the result of typeof null?', opts: ['"null"', '"undefined"', '"object"', '"boolean"'], ans: 2 },
    { q: 'Which method adds an element to the end of an array?', opts: ['pop()', 'push()', 'shift()', 'unshift()'], ans: 1 },
    { q: 'What does the === operator check?', opts: ['Value only', 'Type only', 'Value and type', 'None'], ans: 2 },
    { q: 'Which is a correct arrow function syntax?', opts: ['() -> {}', 'function() => {}', '() => {}', '=> () {}'], ans: 2 },
    { q: 'Which function parses a string into an integer?', opts: ['parse()', 'toInt()', 'parseInt()', 'Number.int()'], ans: 2 },
    { q: 'When does DOMContentLoaded fire?', opts: ['Before HTML is read', 'After images load', 'After HTML is parsed', 'During page unload'], ans: 2 },
    { q: 'How do you handle errors in an async function?', opts: ['if (error) {}', 'try...catch', 'check...catch', 'throw new Error()'], ans: 1 },
    { q: 'What is a closure in JavaScript?', opts: ['A loop', 'A function with its outer scope', 'A class method', 'An object property'], ans: 1 },
    { q: 'Which method returns a NEW array with filtered items?', opts: ['find()', 'map()', 'filter()', 'forEach()'], ans: 2 },
  ],
  python: [
    { q: 'How do you start a comment in Python?', opts: ['//', '/*', '#', '--'], ans: 2 },
    { q: 'Which function returns the length of a list?', opts: ['count()', 'size()', 'len()', 'length()'], ans: 2 },
    { q: 'How do you define a function in Python?', opts: ['function', 'def', 'func', 'fn'], ans: 1 },
    { q: 'What is the correct way to create a dictionary?', opts: ['[a, b]', '{a, b}', '{"key": "val"}', '(a, b)'], ans: 2 },
    { q: 'Which loop iterates over a sequence?', opts: ['for', 'while', 'switch', 'foreach'], ans: 0 },
    { q: 'What does append() do to a list?', opts: ['Remove item', 'Sort items', 'Add to end', 'Add to start'], ans: 2 },
    { q: 'How do you handle exceptions in Python?', opts: ['try...catch', 'try...except', 'if...else', 'check...fail'], ans: 1 },
    { q: 'What is the output of print(2 ** 3)?', opts: ['5', '6', '8', '9'], ans: 2 },
    { q: 'Which syntax is used for inheritance?', opts: ['class A -> B', 'class B(A)', 'class B extends A', 'class B : A'], ans: 1 },
    { q: 'What is the purpose of __init__?', opts: ['Delete object', 'Initialize attributes', 'Run function', 'Print status'], ans: 1 },
  ],
  cpp: [
    { q: 'Which header file is required for I/O?', opts: ['<stdio.h>', '<iostream>', '<conio.h>', '<math.h>'], ans: 1 },
    { q: 'How do you declare a pointer to an integer?', opts: ['int ptr', 'int& ptr', 'int* ptr', 'ptr int'], ans: 2 },
    { q: 'Which operator gets the address of a variable?', opts: ['*', '@', '&', '#'], ans: 2 },
    { q: 'What is the typical size of an int in C++?', opts: ['1 byte', '2 bytes', '4 bytes', '8 bytes'], ans: 2 },
    { q: 'Which keyword allocates dynamic memory?', opts: ['malloc', 'alloc', 'new', 'create'], ans: 2 },
    { q: 'What is a constructor?', opts: ['Method to delete object', 'Function to print output', 'Special initialization method', 'A type of variable'], ans: 2 },
    { q: 'Which is correct for multiple inheritance?', opts: ['class C : A, B', 'class C : public A, public B', 'class C extends A, B', 'class C(A, B)'], ans: 1 },
    { q: 'What does STL stand for?', opts: ['Simple Template Library', 'System Tool Library', 'Standard Template Library', 'Static Tool Language'], ans: 2 },
    { q: 'Which container stores key-value pairs?', opts: ['vector', 'list', 'map', 'set'], ans: 2 },
    { q: 'What is the purpose of virtual functions?', opts: ['Make code faster', 'Run-time polymorphism', 'Memory management', 'Define constants'], ans: 1 },
  ],
  react: [
    { q: 'What does JSX stand for?', opts: ['JavaScript XML', 'JavaScript Extension', 'JSON XML', 'Java XML'], ans: 0 },
    { q: 'How do you pass data to a child component?', opts: ['State', 'Hooks', 'Props', 'Refs'], ans: 2 },
    { q: 'Which hook manages side effects?', opts: ['useState', 'useRef', 'useEffect', 'useMemo'], ans: 2 },
    { q: 'Component names must start with...?', opts: ['Lowercase', 'Uppercase', 'Special char', 'Any letter'], ans: 1 },
    { q: 'What is useMemo used for?', opts: ['DOM access', 'Update state', 'Memoize calculations', 'Routing'], ans: 2 },
    { q: 'How do you update state in functional components?', opts: ['this.setState()', 'useState hook', 'updateValue()', 'forceUpdate()'], ans: 1 },
    { q: 'What is the Virtual DOM?', opts: ['A browser feature', 'A lightweight copy of the UI', 'A type of CSS', 'A database'], ans: 1 },
    { q: 'Which library handles routing?', opts: ['express', 'react-router-dom', 'navigation-js', 'link-router'], ans: 1 },
    { q: 'What is Context API used for?', opts: ['Styling', 'Prop drilling prevention', 'API calls', 'Event handling'], ans: 1 },
    { q: 'Why are keys used in lists?', opts: ['To sort items', 'To identify changed items', 'To style items', 'To hide items'], ans: 1 },
  ],
}

// ── CourseCard ─────────────────────────────────────────────────────────────────
function CourseCard({ course, done, enrolled, onClick }) {
  const total = course.chapters.length
  const pct   = Math.round((done / total) * 100)

  return (
    <div
      className="card p-5 rounded-xl cursor-pointer"
      style={{ borderColor: enrolled ? `${course.color}44` : undefined }}
      onClick={onClick}
    >
      <div
        className="h-1.5 rounded-t-xl -mx-5 -mt-5 mb-4 transition-all duration-700"
        style={{ width: `${pct}%`, background: course.color, minWidth: pct > 0 ? 8 : 0 }}
      />
      <div className="flex justify-between items-start mb-3">
        <span className="text-5xl">{course.icon}</span>
        <div className="flex flex-col gap-1.5 items-end">
          <span className="chip chip-slate text-[10px]">{course.level}</span>
          {enrolled && <span className="chip chip-green text-[10px]">Enrolled</span>}
        </div>
      </div>
      <div className="font-orbitron text-[13px] tracking-wide mb-1" style={{ color: course.color }}>{course.title}</div>
      <p className="text-[12px] text-slate-500 mb-3">{course.chapters.length} chapters · Quiz · Mini Project</p>
      <div className="flex justify-between mb-1.5">
        <span className="text-[11px] text-slate-500">{done}/{total} chapters</span>
        <span className="font-orbitron text-[11px] text-gold">+{course.xp} XP</span>
      </div>
      <ProgressBar value={done} max={total} color={course.color} />
      <button className="btn btn-sm btn-outline w-full mt-3">
        {enrolled ? pct > 0 ? `Continue (${pct}%)` : 'Start Course' : 'View Course'}
      </button>
    </div>
  )
}

// ── Project Submit Modal ─────────────────────────────────────────────────────
function ProjectSubmitModal({ open, onClose, courseId, onSuccess }) {
  const [file, setFile]                 = useState(null)
  const [projectTitle, setProjectTitle] = useState('')
  const [description, setDescription]   = useState('')
  const [techStack, setTechStack]       = useState('')
  const [liveLink, setLiveLink]         = useState('')
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [toast, setToast]               = useState('')
  const fileRef                   = useRef(null)

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setFile(null)
      setProjectTitle('')
      setDescription('')
      setTechStack('')
      setLiveLink('')
      setError('')
      setToast('')
      setLoading(false)
    }
  }, [open])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Client-side validation
    if (!projectTitle.trim()) return setError('Please enter a project title')
    if (!description.trim()) return setError('Please enter a project description')
    if (liveLink.trim()) {
      try { new URL(liveLink) } catch { return setError('Please enter a valid URL (http/https)') }
    }
    if (!file) return setError('Please select a .zip file')
    
    const current   = userApi.getCurrentUser()
    const studentId = current?._id || current?.id
    if (!studentId) return setError('You must be logged in to submit a project')

    setLoading(true)
    try {
      const result = await submitProject({ 
        file, 
        projectTitle, 
        description, 
        techStack, 
        liveLink,
        studentId, 
        courseId 
      })
      setToast(`✅ Project submitted! +${result.project?.xpAwarded ?? 100} XP earned!`)
      setTimeout(() => {
        setToast('')
        onSuccess(result)
        onClose()
      }, 2000)
    } catch (err) {
      setError(err.message || 'Submission failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <style>{`
        @keyframes fadeIn  { from { opacity:0 }            to { opacity:1 } }
        @keyframes scaleUp { from { opacity:0; transform:scale(0.88) } to { opacity:1; transform:scale(1) } }
        .proj-modal { animation: scaleUp 0.25s cubic-bezier(.34,1.56,.64,1) both; }
      `}</style>

      <div
        className="proj-modal"
        style={{
          background: 'linear-gradient(145deg, #0d1b33 0%, #0a1628 100%)',
          border: '1px solid rgba(0,245,255,0.25)',
          borderRadius: 16,
          padding: '32px',
          width: '100%', maxWidth: 480,
          margin: '0 16px',
          boxShadow: '0 0 40px rgba(0,245,255,0.12), 0 0 80px rgba(139,92,246,0.08)',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily:'Orbitron,sans-serif', fontSize: 14, letterSpacing: 3, color:'#ffd700', marginBottom: 4 }}>
              🏃 MINI PROJECT
            </div>
            <div style={{ fontFamily:'Orbitron,sans-serif', fontSize: 20, color:'#fff' }}>Submit Your Work</div>
          </div>
          <button
            onClick={onClose}
            style={{ background:'none', border:'none', color:'#64748b', fontSize: 22, cursor:'pointer', lineHeight:1, padding:4 }}
            aria-label="Close modal"
          >✕</button>
        </div>

        {/* XP badge */}
        <div style={{
          display: 'inline-flex', alignItems:'center', gap:6,
          background:'linear-gradient(90deg,#1a2f5a,#2a1a4a)',
          border:'1px solid rgba(255,215,0,0.3)', borderRadius:20,
          padding:'4px 14px', marginBottom: 24, fontSize:12,
          fontFamily:'Orbitron,sans-serif', color:'#ffd700'
        }}>
          ⚡ +100 XP on successful submission
        </div>

        <form onSubmit={handleSubmit}>
          {/* Project Title */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display:'block', fontFamily:'Orbitron,sans-serif', fontSize:10, letterSpacing:2, color:'#94a3b8', marginBottom:8 }}>
              PROJECT TITLE
            </label>
            <input
              type="text"
              placeholder="e.g. My Portfolio Website"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              style={{
                width:'100%', boxSizing:'border-box', background:'rgba(15,22,40,0.8)',
                border:`1px solid ${projectTitle ? 'rgba(0,245,255,0.4)' : 'rgba(42,63,106,0.8)'}`,
                borderRadius:8, padding:'11px 14px', color:'#e2e8f0', fontSize:13, outline:'none', transition:'all 0.2s',
              }}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display:'block', fontFamily:'Orbitron,sans-serif', fontSize:10, letterSpacing:2, color:'#94a3b8', marginBottom:8 }}>
              DESCRIPTION
            </label>
            <textarea
              placeholder="What did you build? How does it work?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{
                width:'100%', boxSizing:'border-box', background:'rgba(15,22,40,0.8)',
                border:`1px solid ${description ? 'rgba(0,245,255,0.4)' : 'rgba(42,63,106,0.8)'}`,
                borderRadius:8, padding:'11px 14px', color:'#e2e8f0', fontSize:13, outline:'none', transition:'all 0.2s',
                resize: 'none'
              }}
            />
          </div>

          {/* Tech Stack */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display:'block', fontFamily:'Orbitron,sans-serif', fontSize:10, letterSpacing:2, color:'#94a3b8', marginBottom:8 }}>
              TECH STACK (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. React, Node.js, MongoDB"
              value={techStack}
              onChange={(e) => setTechStack(e.target.value)}
              style={{
                width:'100%', boxSizing:'border-box', background:'rgba(15,22,40,0.8)',
                border:`1px solid ${techStack ? 'rgba(0,245,255,0.4)' : 'rgba(42,63,106,0.8)'}`,
                borderRadius:8, padding:'11px 14px', color:'#e2e8f0', fontSize:13, outline:'none', transition:'all 0.2s',
              }}
            />
          </div>

          {/* Live Preview Link */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display:'block', fontFamily:'Orbitron,sans-serif', fontSize:10, letterSpacing:2, color:'#94a3b8', marginBottom:8 }}>
              LIVE PREVIEW LINK (OPTIONAL)
            </label>
            <input
              type="url"
              placeholder="https://my-deployment.vercel.app"
              value={liveLink}
              onChange={(e) => setLiveLink(e.target.value)}
              style={{
                width:'100%', boxSizing:'border-box', background:'rgba(15,22,40,0.8)',
                border:`1px solid ${liveLink ? 'rgba(0,245,255,0.4)' : 'rgba(42,63,106,0.8)'}`,
                borderRadius:8, padding:'11px 14px', color:'#e2e8f0', fontSize:13, outline:'none', transition:'all 0.2s',
              }}
            />
          </div>

          {/* ZIP file input */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display:'block', fontFamily:'Orbitron,sans-serif', fontSize:10, letterSpacing:2, color:'#94a3b8', marginBottom:8 }}>
              PROJECT ZIP FILE <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${file ? '#00ff9d' : 'rgba(0,245,255,0.3)'}`,
                borderRadius: 10, padding:'16px', cursor:'pointer',
                textAlign:'center', transition:'all 0.2s',
                background:'rgba(0,245,255,0.03)',
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 4 }}>{file ? '📂' : '☁️'}</div>
              <div style={{ fontSize: 12, color: file ? '#00ff9d' : '#64748b' }}>
                {file ? file.name : 'Select .zip file'}
              </div>
              {file && <div style={{ fontSize:10, color:'#64748b', marginTop:2 }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>}
              <input
                ref={fileRef}
                type="file"
                accept=".zip,application/zip,application/x-zip-compressed"
                style={{ display:'none' }}
                onChange={(e) => setFile(e.target.files[0] || null)}
              />
            </div>
            <div style={{ fontSize:9, color:'#475569', marginTop:4 }}>ZIP ONLY • MAX 500MB</div>
          </div>

          {/* Error message */}
          {error && (
            <div style={{
              background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.4)',
              borderRadius:8, padding:'10px 14px', marginBottom:16,
              color:'#f87171', fontSize:13,
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Toast success */}
          {toast && (
            <div style={{
              background:'rgba(0,255,157,0.12)', border:'1px solid rgba(0,255,157,0.4)',
              borderRadius:8, padding:'10px 14px', marginBottom:16,
              color:'#00ff9d', fontSize:13, textAlign:'center',
              animation:'fadeIn 0.3s ease'
            }}>
              {toast}
            </div>
          )}

          {/* Buttons */}
          <div style={{ display:'flex', gap:12 }}>
            <button
              id="proj-cancel-btn"
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                flex:1, padding:'12px 0', borderRadius:8, cursor:'pointer',
                background:'rgba(30,40,70,0.8)', border:'1px solid rgba(42,63,106,0.8)',
                color:'#94a3b8', fontFamily:'Orbitron,sans-serif', fontSize:11,
                letterSpacing:2, transition:'all 0.2s',
              }}
            >CANCEL</button>
            <button
              id="proj-submit-btn"
              type="submit"
              disabled={loading}
              style={{
                flex:2, padding:'12px 0', borderRadius:8, cursor: loading ? 'not-allowed' : 'pointer',
                background: loading
                  ? 'rgba(30,40,70,0.8)'
                  : 'linear-gradient(135deg, #0080ff 0%, #ffd700 100%)',
                border:'none', color:'#fff',
                fontFamily:'Orbitron,sans-serif', fontSize:11, letterSpacing:2,
                fontWeight:'bold', transition:'all 0.2s',
                opacity: loading ? 0.7 : 1,
                boxShadow: loading ? 'none' : '0 0 20px rgba(0,128,255,0.4)',
              }}
            >
              {loading ? 'UPLOADING...' : 'SUBMIT PROJECT →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Quiz Modal ─────────────────────────────────────────────────────────────────
// FIX: onComplete was called directly inside render (on every re-render while
// done===true), causing an infinite setState → re-render loop and freeze.
// Solution: compute the final score at the moment the last answer is picked,
// store it in state, and notify the parent exactly once via useEffect.
function QuizModal({ open, onClose, courseId, onComplete }) {
  const questions = QUIZ_QUESTIONS[courseId] ?? []
  const [idx, setIdx]           = useState(0)
  const [answers, setAnswers]   = useState([])
  const [finalScore, setFinalScore] = useState(null) // null = in progress

  // Notify parent exactly once when the quiz completes
  useEffect(() => {
    if (finalScore !== null) {
      onComplete(finalScore)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalScore])

  const pick = (chosen) => {
    const next = [...answers, chosen]
    setAnswers(next)

    if (next.length === questions.length) {
      // Calculate score right here with the complete `next` array —
      // don't rely on `answers` state which hasn't updated yet
      const correct = next.filter((a, i) => a === questions[i].ans).length
      const score   = Math.round((correct / questions.length) * 100)
      setFinalScore(score)
    } else {
      setIdx(idx + 1)
    }
  }

  const handleClose = () => {
    // Reset everything so the quiz can be retaken cleanly
    setIdx(0)
    setAnswers([])
    setFinalScore(null)
    onClose()
  }

  // Results screen
  if (finalScore !== null) {
    return (
      <Modal open={open} onClose={handleClose}>
        <div className="p-8 text-center">
          <div className="text-6xl mb-4">{finalScore >= 70 ? '🎉' : '😅'}</div>
          <div className="font-orbitron text-2xl text-gold mb-2">Quiz Complete!</div>
          <div
            className="text-5xl font-orbitron font-black mb-4"
            style={{ color: finalScore >= 70 ? '#00ff9d' : '#ff6b35' }}
          >
            {finalScore}%
          </div>
          <p className="text-slate-400 mb-2">
            {finalScore >= 70 ? 'Excellent work!' : 'Keep practicing!'}
          </p>
          <p className="chip chip-gold inline-flex mb-6">+50 XP earned</p>
          <div>
            <button className="btn btn-lg btn-cyan" onClick={handleClose}>Continue</button>
          </div>
        </div>
      </Modal>
    )
  }

  // Question screen
  const q = questions[idx]
  return (
    <Modal open={open} onClose={handleClose}>
      <div className="p-8">
        <div className="flex justify-between items-center mb-4">
          <div className="font-orbitron text-[12px] text-slate-400 tracking-widest">
            QUESTION {idx + 1} / {questions.length}
          </div>
          <button onClick={handleClose} className="text-slate-500 hover:text-white text-xl leading-none">✕</button>
        </div>
        <ProgressBar value={idx} max={questions.length} color="#00f5ff" className="mb-6" />
        <p className="text-lg font-semibold mb-5">{q?.q}</p>
        <div className="flex flex-col gap-3">
          {q?.opts.map((opt, i) => (
            <button
              key={i}
              onClick={() => pick(i)}
              className="text-left p-3.5 rounded-lg border border-border bg-bg-3 hover:border-cyan hover:bg-cyan/5 transition-all text-sm font-medium"
            >
              <span className="font-orbitron text-[10px] text-cyan mr-3">
                {['A', 'B', 'C', 'D'][i]}
              </span>
              {opt}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  )
}

// ── CourseDetail ───────────────────────────────────────────────────────────────
function CourseDetail({ course, completedChapters, completeChapter, quizScores, saveQuizScore, completedProjects, completeProject, gainXP, viewedLessons, onBack }) {
  const navigate = useNavigate()
  const [openChap, setOpenChap]                 = useState(null)
  const [quizOpen, setQuizOpen]                 = useState(false)
  const [projectModalOpen, setProjectModalOpen] = useState(false)

  const done        = completedChapters[course.id] || []
  const allDone     = done.length === course.chapters.length
  const pct         = Math.round((done.length / course.chapters.length) * 100)
  const quizScore   = quizScores[course.id] ?? null
  const projectDone = completedProjects.includes(course.id)

  const handleQuizComplete = (score) => {
    saveQuizScore(course.id, score)
  }

  // Called when backend confirms the project was saved
  const handleProjectSuccess = (result) => {
    completeProject(course.id)  // marks done locally + awards XP via gainXP inside hook
  }

  return (
    <div className="max-w-3xl">
      <button onClick={onBack} className="btn btn-sm btn-outline mb-5">← BACK</button>

      {/* Header */}
      <div className="glass p-6 rounded-xl mb-5" style={{ borderColor: `${course.color}33` }}>
        <div className="flex gap-4 items-start flex-wrap">
          <span className="text-6xl">{course.icon}</span>
          <div className="flex-1">
            <div className="font-orbitron text-xl mb-2" style={{ color: course.color }}>{course.title}</div>
            <p className="text-slate-400 text-sm mb-3">{course.description}</p>
            <div className="flex gap-2 flex-wrap mb-3">
              <span className="chip chip-slate">{course.level}</span>
              <span className="chip chip-gold">+{course.xp} XP Total</span>
              <span className="chip chip-cyan">{course.chapters.length} Chapters</span>
              <span className="chip chip-purple">+5 XP per chapter</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-[12px] text-slate-400">{done.length}/{course.chapters.length} chapters</span>
              <span className="font-mono text-[12px]" style={{ color: course.color }}>{pct}%</span>
            </div>
            <ProgressBar value={done.length} max={course.chapters.length} color={course.color} height="h-2" />
          </div>
        </div>
      </div>

      {/* Chapters */}
      <div className="glass rounded-xl overflow-hidden mb-5">
        <div className="px-5 py-3 border-b border-border">
          <p className="section-label mb-0">CHAPTERS</p>
        </div>
        {course.chapters.map(ch => {
          const isDone = done.includes(ch.id)
          const isOpen = openChap === ch.id
          return (
            <div key={ch.id} className="border-b border-border last:border-0">
              <div
                className={`flex items-center gap-3 px-5 py-4 cursor-pointer transition-colors ${isOpen ? 'bg-cyan/4' : 'hover:bg-panel-2/50'}`}
                onClick={() => setOpenChap(isOpen ? null : ch.id)}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 font-orbitron font-bold"
                  style={{
                    backgroundColor: isDone ? '#00ff9d22' : '#0f1628',
                    border: `2px solid ${isDone ? '#00ff9d' : '#2a3f6a'}`,
                    color: isDone ? '#00ff9d' : '#64748b',
                    boxShadow: isDone ? '0 0 10px rgba(0,255,157,0.4)' : 'none',
                  }}
                >
                  {isDone ? '✓' : ch.id}
                </div>
                <span className="flex-1 font-semibold text-sm">Chapter {ch.id}: {ch.title}</span>
                <span className="chip chip-gold text-[10px]">+5 XP</span>
                {isDone && <span className="chip chip-green text-[10px]">Done ✓</span>}
                <span className="text-slate-500 text-sm ml-2">{isOpen ? '▲' : '▼'}</span>
              </div>

              {isOpen && (
                <div className="px-5 pb-4 pl-16 bg-bg-3 animate-fade-up">
                  <div className="flex flex-col gap-2 mb-4">
                    {ch.subs.map((sub, i) => (
                      <div 
                        key={i} 
                        onClick={() => navigate(`/app/lessons/${course.id}/${encodeURIComponent(ch.title)}?lesson=${encodeURIComponent(sub)}`)}
                        className="flex items-center gap-2.5 px-3 py-2.5 bg-panel hover:bg-cyan/10 hover:border-cyan/50 cursor-pointer rounded-lg border border-border text-sm transition-all"
                      >
                        <span className="text-cyan text-[10px]">▶</span>
                        <span>{sub}</span>
                        <span className="ml-auto text-[11px] text-cyan/70 font-semibold uppercase tracking-widest font-orbitron">Begin →</span>
                      </div>
                    ))}
                  </div>
                  {!isDone
                    ? (() => {
                        const viewedCount = (viewedLessons[course.id]?.[ch.title] || []).length;
                        const isRead = viewedCount >= ch.subs.length;
                        return (
                          <div className="flex flex-col gap-2 items-start">
                            {!isRead && (
                               <div className="flex items-center gap-2 text-[11px] font-orbitron text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                                 <span>📖 PROGRESS: {viewedCount}/{ch.subs.length} LESSONS READ</span>
                               </div>
                            )}
                            <button 
                              className={`btn btn-md ${isRead ? 'btn-cyan' : 'btn-outline border-slate-700 text-slate-500 cursor-not-allowed opacity-60'}`} 
                              onClick={() => isRead && completeChapter(course.id, ch.id)}
                              disabled={!isRead}
                              title={!isRead ? `Read all ${ch.subs.length} lessons to unlock` : ''}
                            >
                              {isRead ? '✅ Mark Complete (+5 XP)' : '🔒 Read all lessons to unlock'}
                            </button>
                          </div>
                        )
                      })()
                    : <span className="text-neon-green text-sm font-semibold">✓ Chapter Completed!</span>
                  }
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Quiz & Project */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass p-5 rounded-xl" style={{ borderColor: allDone ? 'rgba(0,245,255,0.3)' : undefined, opacity: allDone ? 1 : 0.5 }}>
          <div className="text-3xl mb-2">📝</div>
          <div className="font-orbitron text-[13px] text-cyan mb-2">FINAL QUIZ</div>
          <p className="text-sm text-slate-400 mb-4">
            {allDone ? 'All chapters done! Take the final quiz.' : `Complete all ${course.chapters.length} chapters first.`}
          </p>
          {quizScore !== null && (
            <div className="chip chip-green mb-3">Score: {quizScore}% 🎉</div>
          )}
          <button
            className="btn btn-md btn-cyan"
            disabled={!allDone}
            onClick={() => setQuizOpen(true)}
          >
            {quizScore !== null ? 'Retake Quiz' : 'Take Quiz  +50 XP'}
          </button>
        </div>

        <div className="glass p-5 rounded-xl" style={{ borderColor: quizScore >= 60 ? 'rgba(255,215,0,0.3)' : undefined, opacity: quizScore >= 60 ? 1 : 0.5 }}>
          <div className="text-3xl mb-2">🏗️</div>
          <div className="font-orbitron text-[13px] text-gold mb-2">MINI PROJECT</div>
          <p className="text-sm text-slate-400 mb-4">
            {quizScore === null ? 'Complete the quiz first.' : (quizScore < 60 ? 'Score at least 60% in the quiz to unlock the project.' : 'Build a real-world project to complete the course!')}
          </p>
          {projectDone && <div className="chip chip-green mb-3">Project Submitted! 🎉</div>}
          {!projectDone && (
            <button
              id={`start-project-btn-${course.id}`}
              className="btn btn-md btn-gold"
              disabled={quizScore === null || quizScore < 60}
              onClick={() => setProjectModalOpen(true)}
            >
              Start Project +100 XP
            </button>
          )}
        </div>
      </div>

      <QuizModal
        open={quizOpen}
        onClose={() => setQuizOpen(false)}
        courseId={course.id}
        onComplete={handleQuizComplete}
      />

      {/* Project Submit Modal */}
      <ProjectSubmitModal
        open={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        courseId={course.id}
        onSuccess={handleProjectSuccess}
      />
    </div>
  )
}

// ── Main Courses Page ──────────────────────────────────────────────────────────
export default function Courses() {
  const { enrolledCourses, enroll, completedChapters, completeChapter, quizScores, saveQuizScore, completedProjects, completeProject, gainXP, viewedLessons } = useOutletContext()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const [selected, setSelected] = useState(() => {
    const cid = searchParams.get('courseId');
    return cid ? COURSES.find(c => c.id === cid) || null : null;
  })
  
  const [tab, setTab] = useState('all')

  if (selected) {
    return (
      <CourseDetail
        course={selected}
        completedChapters={completedChapters}
        completeChapter={completeChapter}
        quizScores={quizScores}
        saveQuizScore={saveQuizScore}
        completedProjects={completedProjects}
        completeProject={completeProject}
        gainXP={gainXP}
        viewedLessons={viewedLessons}
        onBack={() => {
          setSelected(null)
          searchParams.delete('courseId')
          setSearchParams(searchParams)
        }}
      />
    )
  }

  const filtered =
    tab === 'enrolled'  ? COURSES.filter(c => enrolledCourses.includes(c.id)) :
    tab === 'available' ? COURSES.filter(c => !enrolledCourses.includes(c.id)) :
    COURSES

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="font-orbitron text-lg tracking-widest">COURSE LIBRARY</div>
        <div className="flex gap-1.5">
          {['all', 'enrolled', 'available'].map(t => (
            <button key={t} className={`tab-btn ${tab === t ? 'tab-active' : ''}`} onClick={() => setTab(t)}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(course => (
          <CourseCard
            key={course.id}
            course={course}
            done={(completedChapters[course.id] || []).length}
            enrolled={enrolledCourses.includes(course.id)}
            onClick={() => { 
                enroll(course.id); 
                setSelected(course);
                setSearchParams({ courseId: course.id });
            }}
          />
        ))}
      </div>
    </div>
  )
}

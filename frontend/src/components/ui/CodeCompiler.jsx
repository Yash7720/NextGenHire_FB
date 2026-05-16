import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

const LANGUAGE_MAP = {
  javascript: { judge0Id: 93, defaultCode: 'console.log("Hello, World!");' },
  js: { judge0Id: 93, defaultCode: 'console.log("Hello, World!");' },
  python: { judge0Id: 92, defaultCode: 'print("Hello, World!")' },
  cpp: { judge0Id: 54, defaultCode: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}' },
  java: { judge0Id: 91, defaultCode: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}' },
  html: { judge0Id: null, defaultCode: '<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    body { font-family: sans-serif; text-align: center; margin-top: 50px; }\n    h1 { color: #00f5ff; }\n  </style>\n</head>\n<body>\n  <h1>Hello, NextGenHire!</h1>\n  <p>Edit this HTML to see changes.</p>\n</body>\n</html>' },
  css: { judge0Id: null, defaultCode: '<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    /* Write your CSS here! */\n    body { font-family: sans-serif; text-align: center; margin-top: 50px; background: #0f1628; color: white; }\n    h1 { color: #00f5ff; text-shadow: 0 0 10px #00f5ff; }\n  </style>\n</head>\n<body>\n  <h1>CSS Playground</h1>\n  <p>Edit the styles above to see the changes.</p>\n</body>\n</html>' },
  react: { judge0Id: null, defaultCode: '<!DOCTYPE html>\n<html>\n<body>\n  <!-- For full React, we recommend using Create React App. Here is a basic HTML playground. -->\n  <h1>React/Web Playground</h1>\n  <p>Write HTML, CSS, or script tags here.</p>\n</body>\n</html>' }
};

export default function CodeCompiler({ defaultLanguage = 'javascript', defaultCode = '' }) {
  const getNormalizedLang = (lang) => {
    if (['html', 'css', 'react'].includes(lang)) return 'html';
    if (lang === 'js') return 'javascript';
    return LANGUAGE_MAP[lang] ? lang : 'javascript';
  };
  
  const normalizedDefaultLang = getNormalizedLang(defaultLanguage);
  const [language, setLanguage] = useState(normalizedDefaultLang);
  const [code, setCode] = useState(defaultCode || LANGUAGE_MAP[normalizedDefaultLang].defaultCode || '');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const lang = getNormalizedLang(defaultLanguage);
    setLanguage(lang);
    setCode(defaultCode || LANGUAGE_MAP[lang].defaultCode);
    setOutput('');
  }, [defaultLanguage, defaultCode]);

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    // If they switch back to the lesson's original language, restore the lesson's specific example code
    if (newLang === getNormalizedLang(defaultLanguage)) {
      setCode(defaultCode || LANGUAGE_MAP[newLang]?.defaultCode || '');
    } else {
      setCode(LANGUAGE_MAP[newLang]?.defaultCode || '');
    }
    setOutput('');
  };

  const handleRun = async () => {
    if (language === 'html') {
      // HTML/CSS/JS is handled live by the iframe
      return;
    }

    setIsRunning(true);
    setOutput('Running code...');

    try {
      const langConfig = LANGUAGE_MAP[language] || LANGUAGE_MAP['javascript'];
      const langId = langConfig.judge0Id;

      const res = await fetch('https://ce.judge0.com/submissions?base64_encoded=false&wait=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_code: code,
          language_id: langId
        })
      });

      const data = await res.json();
      
      if (res.ok) {
        let result = data.stdout || '';
        if (data.stderr) result += `\n[STDERR]:\n${data.stderr}`;
        if (data.compile_output) result += `\n[COMPILER]:\n${data.compile_output}`;
        if (data.status?.id !== 3 && data.status?.description) {
           result = `[Status: ${data.status.description}]\n\n${result}`;
        }
        setOutput(result || 'Program finished with no output.');
      } else {
        setOutput(`API Error: ${data.error || 'Failed to submit code'}`);
      }
    } catch (error) {
      console.error(error);
      setOutput(`Failed to execute code. Connection error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="rounded-xl overflow-hidden border border-cyan/20 bg-bg-3/80 shadow-2xl shadow-cyan/5 flex flex-col h-[500px] animate-fade-up">
      {/* Header Toolbar */}
      <div className="bg-[#0a0f1a] p-3 border-b border-cyan/20 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5 ml-2 opacity-70 hover:opacity-100 transition-opacity">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]"></div>
            <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
          </div>
          <select 
            value={language} 
            onChange={handleLanguageChange}
            className="ml-4 bg-panel border border-border/50 rounded text-xs text-cyan font-orbitron px-2 py-1.5 outline-none focus:border-cyan hover:border-cyan/50 transition-colors cursor-pointer"
          >
            <option value="html">HTML</option>
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
          </select>
        </div>
        
        {language !== 'html' && (
          <button 
            onClick={handleRun}
            disabled={isRunning}
            className={`flex items-center gap-2 px-5 py-1.5 rounded-lg font-orbitron text-[11px] tracking-widest transition-all shadow-lg
              ${isRunning 
                ? 'bg-slate-800 text-slate-500 cursor-wait border border-slate-700' 
                : 'bg-cyan text-[#0a0f1a] hover:bg-white hover:shadow-[0_0_20px_rgba(0,245,255,0.6)] border border-transparent'
              }`}
          >
            {isRunning ? (
              <>
                <svg className="animate-spin h-3 w-3 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                EXECUTING...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                RUN CODE
              </>
            )}
          </button>
        )}
      </div>

      {/* Editor & Output Split */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-[#050810]">
        {/* Editor Pane */}
        <div className="flex-1 border-b md:border-b-0 md:border-r border-border relative">
          <Editor
            height="100%"
            language={language === 'c++' || language === 'cpp' ? 'cpp' : language === 'js' ? 'javascript' : language}
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value)}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
              padding: { top: 16 },
              scrollBeyondLastLine: false,
              roundedSelection: false,
              scrollbar: { useShadows: false, verticalScrollbarSize: 8, horizontalScrollbarSize: 8 }
            }}
            loading={
              <div className="flex items-center justify-center h-full text-cyan font-orbitron animate-pulse text-sm">
                Initializing Editor Environment...
              </div>
            }
          />
        </div>

        {/* Output Pane */}
        <div className="flex-1 flex flex-col min-w-[300px] md:max-w-[50%]">
          <div className="bg-[#0a0f1a]/50 py-2 px-4 border-b border-border flex justify-between items-center">
            <span className="text-[10px] text-slate-500 font-orbitron tracking-widest uppercase">
              {language === 'html' ? 'Live Browser Preview' : 'Terminal Output'}
            </span>
            {language === 'html' && (
               <span className="flex h-2 w-2 relative">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
               </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto bg-[#0a0f1a]/30">
            {language === 'html' ? (
              <iframe 
                srcDoc={code} 
                title="html-preview" 
                className="w-full h-full border-none bg-white"
                sandbox="allow-scripts"
              />
            ) : (
              <div className="p-4 font-mono text-sm leading-relaxed">
                <pre className={`whitespace-pre-wrap m-0 ${output.includes('Error') || output.includes('Exception') || output.includes('exited with code') ? 'text-red-400' : 'text-green-400'}`}>
                  {output || (
                    <span className="text-slate-600 select-none">
                      $ Code Execution Environment Ready.<br/>
                      $ Awaiting instructions...
                    </span>
                  )}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import Editor, { OnChange, loader } from '@monaco-editor/react';
import React, { useRef, useEffect, useState } from 'react';
import { cn } from '../lib/utils';

// Configure monaco loader to use a specific version from jsdelivr
// This is often more stable than the generic latest version.
loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs'
  }
});

interface CodeEditorProps {
  code: string;
  onChange?: (value: string | undefined) => void;
  onLineClick?: (line: number) => void;
  language?: string;
  theme?: string;
}

export default function CodeEditor({ 
  code, 
  onChange, 
  onLineClick,
  language = 'python', 
  theme = 'vs-dark' 
}: CodeEditorProps) {
  const editorRef = useRef<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    // Manually trigger loader init to catch errors and log them
    loader.init()
      .then(() => console.log('Monaco initialized successfully'))
      .catch(err => {
        console.error('Monaco failed to load:', err);
        setLoadError(err instanceof Error ? err.message : String(err));
      });
  }, []);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    
    editor.onDidChangeCursorPosition((e: any) => {
      if (onLineClick) {
        onLineClick(e.position.lineNumber);
      }
    });
  };

  if (loadError) {
    return (
      <div className="w-full h-full border border-red-500/30 overflow-hidden bg-red-500/5 flex flex-col items-center justify-center p-6 text-center font-mono">
        <div className="w-10 h-10 border border-red-500 flex items-center justify-center mb-4 text-red-500 uppercase font-bold">
          Err
        </div>
        <h3 className="text-red-400 font-bold mb-2 uppercase tracking-widest text-xs">加载失败</h3>
        <p className="text-red-400/60 text-[9px] mb-4 max-w-xs uppercase">{loadError}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 border border-red-500/40 hover:bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-widest transition-colors"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className={cn("w-full h-full overflow-hidden", (theme === 'vs' || theme === 'light') ? "bg-white" : "bg-[#050505]")}>
      <Editor
        height="100%"
        defaultLanguage={language}
        value={code}
        onChange={onChange}
        onMount={handleEditorDidMount}
        theme={theme}
        loading={
          <div className={cn("flex flex-col items-center justify-center h-full gap-4 font-mono", (theme === 'vs' || theme === 'light') ? "bg-white" : "bg-[#050505]")}>
            <div className="w-10 h-10 border border-emerald-500/20 flex items-center justify-center">
              <div className="w-4 h-4 border border-emerald-500/40 animate-spin" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-emerald-500/40 uppercase tracking-[0.3em]">初始化缓冲区</span>
              <span className="text-[8px] opacity-20 uppercase tracking-[0.5em]">编辑器核心</span>
            </div>
          </div>
        }
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          scrollBeyondLastLine: false,
          padding: { top: 20, bottom: 20 },
          fontFamily: 'JetBrains Mono, monospace',
          roundedSelection: false,
          automaticLayout: true,
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          scrollbar: {
            vertical: 'visible',
            horizontal: 'visible',
            verticalSliderSize: 6,
            horizontalSliderSize: 6,
          },
          lineNumbers: 'on',
          renderLineHighlight: 'all',
          hideCursorInOverviewRuler: true,
          overviewRulerBorder: false,
        }}
      />
    </div>
  );
}

import Editor, { OnChange, loader } from '@monaco-editor/react';
import React, { useRef } from 'react';

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

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    
    editor.onDidChangeCursorPosition((e: any) => {
      if (onLineClick) {
        onLineClick(e.position.lineNumber);
      }
    });
  };

  return (
    <div className="w-full h-full min-h-[300px] border border-white/10 rounded-lg overflow-hidden">
      <Editor
        height="100%"
        defaultLanguage={language}
        value={code}
        onChange={onChange}
        onMount={handleEditorDidMount}
        theme={theme}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          scrollBeyondLastLine: false,
          padding: { top: 16, bottom: 16 },
          fontFamily: 'JetBrains Mono, monospace',
          roundedSelection: true,
          automaticLayout: true,
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
        }}
      />
    </div>
  );
}

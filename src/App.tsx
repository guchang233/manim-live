import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Code, Eye, Settings2, Download, Copy, Check, Menu, MessageSquare, Play, Pause, GripHorizontal, Square, Terminal, Files, Search, Brain, HelpCircle, X, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Panel, Group, Separator, PanelImperativeHandle } from 'react-resizable-panels';
import Chat from './components/Chat';
import Sidebar from './components/Sidebar';
import CodeEditor from './components/Editor';
import Preview from './components/Preview';
import SettingsModal from './components/SettingsModal';
import { ChatMessage, ManimProject, Session, UserSettings, DEFAULT_SETTINGS } from './types';
import { generateAnimation } from './services/gemini';
import { cn } from './lib/utils';

const DEFAULT_PROJECT = {
  manimCode: '# 您的 Manim 代码将显示在这里',
  previewCode: 'export default () => <div className="text-white/20 p-8 text-center text-xs font-mono uppercase tracking-widest">Awaiting First Generation</div>',
  name: '未命名动画'
};

export default function App() {
  const [sessions, setSessions] = useState<Session[]>(() => {
    const saved = localStorage.getItem('manim_sessions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('manim_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Sanitize model choice if it's deprecated or prohibited
        if (['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'].includes(parsed.model)) {
          parsed.model = DEFAULT_SETTINGS.model;
        }
        return parsed;
      } catch (e) {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return sessions.length > 0 ? sessions[0].id : '';
  });

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(true);
  const [isEditorVisible, setIsEditorVisible] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState(0.5);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<'python' | 'react'>('python');
  const [localCode, setLocalCode] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeActivity, setActiveActivity] = useState<'explorer' | 'search' | 'ai' | 'settings'>('explorer');

  // Refs for panels
  const sidebarPanelRef = useRef<PanelImperativeHandle>(null);
  const chatPanelRef = useRef<PanelImperativeHandle>(null);

  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize first session if empty
  useEffect(() => {
    const init = async () => {
      if (sessions.length === 0) {
        handleNewSession();
      } else if (!activeSessionId && sessions.length > 0) {
        setActiveSessionId(sessions[0].id);
      }
      // Wait a tiny bit for the state to settle
      setTimeout(() => setIsInitializing(false), 100);
    };
    init();
  }, []);

  useEffect(() => {
    if (activeSession) {
      const code = activeTab === 'python' 
        ? (activeSession.currentProject.manimCode || '')
        : (activeSession.currentProject.previewCode || '');
      setLocalCode(code);
      setHasUnsavedChanges(false);
    }
  }, [activeSessionId, activeSession?.currentProject.manimCode, activeSession?.currentProject.previewCode, activeTab]);

  const handleLocalCodeChange = (val: string | undefined) => {
    const newVal = val || '';
    setLocalCode(newVal);
    
    const originalCode = activeTab === 'python' 
      ? activeSession?.currentProject.manimCode 
      : activeSession?.currentProject.previewCode;
      
    setHasUnsavedChanges(newVal !== originalCode);
    
    // For React tab, we can enable "Live" updates if we want, 
    // but to keep it consistent with Python, we still use the Render button or just update state.
    // Let's make React LIVE by default if user is in that tab.
    if (activeTab === 'react' && activeSession) {
      updateSession(activeSession.id, {
        currentProject: {
          ...activeSession.currentProject,
          previewCode: newVal
        }
      });
    }
  };

  const handleReRender = async () => {
    if (!activeSession) return;
    setIsLoading(true);
    try {
      if (activeTab === 'python') {
        updateSession(activeSession.id, {
          currentProject: {
            ...activeSession.currentProject,
            manimCode: localCode
          }
        });
      } else {
        updateSession(activeSession.id, {
          currentProject: {
            ...activeSession.currentProject,
            previewCode: localCode
          }
        });
      }
      setHasUnsavedChanges(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 800);
    }
  };

  const handleLineClick = (lineNum: number) => {
    if (!localCode) return;
    const lines = localCode.split('\n');
    for (let i = lineNum - 1; i >= 0; i--) {
      const match = lines[i].match(/# @progress:\s*([0-9.]+)/);
      if (match) {
        const p = parseFloat(match[1]);
        if (!isNaN(p)) {
          setProgress(p);
          setIsPlaying(false);
          break;
        }
      }
    }
  };

  useEffect(() => {
    let interval: number;
    if (isPlaying) {
      interval = window.setInterval(() => {
        setProgress(prev => {
          const next = prev + 0.01;
          return next > 1 ? 0 : next;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    localStorage.setItem('manim_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('manim_settings', JSON.stringify(settings));
  }, [settings]);

  const handleNewSession = () => {
    const newSession: Session = {
      id: Date.now().toString(),
      title: '新动画会话',
      messages: [],
      currentProject: { ...DEFAULT_PROJECT },
      updatedAt: Date.now()
    };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newSession.id);
  };

  const updateSession = (id: string, updates: Partial<Session>) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s));
  };

  const handleDeleteSession = (id: string) => {
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    if (id === activeSessionId && updated.length > 0) {
      setActiveSessionId(updated[0].id);
    } else if (updated.length === 0) {
      handleNewSession();
    }
  };

  const handleSendMessage = async (content: string, includeProgress: boolean = false) => {
    if (!activeSession) return;

    let finalContent = content;
    if (includeProgress) {
      finalContent = `在动画进度为 ${(progress * 100).toFixed(0)}% 的位置进行以下微调：${content}`;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: finalContent
    };
    
    const newMessages = [...activeSession.messages, userMessage];
    updateSession(activeSession.id, { messages: newMessages });
    setIsLoading(true);

    try {
      const history = activeSession.messages.map(m => ({ role: m.role, content: m.content }));
      const result = await generateAnimation(finalContent, history, settings);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.explanation,
        project: {
          manimCode: result.pythonCode,
          previewCode: result.reactCode,
          name: result.refinedDescription
        }
      };

      updateSession(activeSession.id, { 
        messages: [...newMessages, assistantMessage],
        currentProject: assistantMessage.project,
        title: result.refinedDescription
      });
    } catch (error) {
      console.error("Failed to generate animation:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "抱歉，在生成动画时遇到了错误。请重试。"
      };
      updateSession(activeSession.id, { messages: [...newMessages, errorMessage] });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (!activeSession) return;
    const blob = new Blob([JSON.stringify(activeSession, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manim_${activeSession.title.replace(/\s+/g, '_')}_${activeSession.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isInitializing || !activeSession) {
    return (
      <div className="h-screen w-full bg-[#000] flex flex-col items-center justify-center gap-4 font-mono">
        <div className="w-12 h-12 border border-[#333] flex items-center justify-center animate-pulse">
          <Terminal className="text-emerald-500 w-6 h-6" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-emerald-500 font-bold text-lg tracking-widest uppercase">MANIM_SYSTEM_V1.0</h1>
          <span className="text-[10px] text-emerald-500/40 uppercase tracking-[0.4em]">INIT_SEQUENSE_RUNNING...</span>
        </div>
      </div>
    );
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSidebar = () => {
    const panel = sidebarPanelRef.current;
    if (panel) {
      if (panel.isCollapsed()) panel.expand();
      else panel.collapse();
    }
  };

  const toggleChat = () => {
    const panel = chatPanelRef.current;
    if (panel) {
      if (panel.isCollapsed()) panel.expand();
      else panel.collapse();
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#1e1e1e] text-[#cccccc] font-sans overflow-hidden select-none">
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={setSettings}
      />

      {/* ACTIVITY BAR */}
      <div className="w-12 bg-[#333333] border-r border-[#252526] flex flex-col items-center py-2 gap-4 shrink-0 z-50">
        <div 
          onClick={() => {
            setActiveActivity('explorer');
            if (isSidebarCollapsed) toggleSidebar();
          }}
          className={cn(
            "p-2.5 cursor-pointer transition-colors relative group",
            activeActivity === 'explorer' && !isSidebarCollapsed ? "text-white" : "text-[#858585] hover:text-white"
          )}
        >
          <Files className="w-6 h-6" />
          {activeActivity === 'explorer' && !isSidebarCollapsed && <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-white" />}
        </div>
        <div 
          onClick={() => setActiveActivity('search')}
          className={cn(
            "p-2.5 cursor-pointer transition-colors relative",
            activeActivity === 'search' ? "text-white" : "text-[#858585] hover:text-white"
          )}
        >
          <Search className="w-6 h-6" />
        </div>
        <div 
          onClick={() => {
            setActiveActivity('ai');
            if (isChatCollapsed) toggleChat();
          }}
          className={cn(
            "p-2.5 cursor-pointer transition-colors relative",
            activeActivity === 'ai' && !isChatCollapsed ? "text-white" : "text-[#858585] hover:text-white"
          )}
        >
          <Brain className="w-6 h-6" />
          {activeActivity === 'ai' && !isChatCollapsed && <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-white" />}
        </div>
        
        <div className="mt-auto flex flex-col items-center gap-4 border-t border-white/5 pt-4 w-full">
          <div 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 cursor-pointer text-[#858585] hover:text-white transition-colors"
          >
            <Settings2 className="w-6 h-6" />
          </div>
          <div className="p-2.5 cursor-pointer text-[#858585] hover:text-white transition-colors mb-2">
            <HelpCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      <Group 
        orientation="horizontal" 
        className="flex-1 h-full w-full overflow-hidden" 
        id="main-app-layout"
      >
        {/* SIDEBAR (FILE EXPLORER) */}
        <Panel 
          id="sidebar-panel"
          panelRef={sidebarPanelRef}
          defaultSize={18} 
          minSize={0} 
          collapsible
          className="relative bg-[#252526]"
          onResize={(size) => setIsSidebarCollapsed(size.asPercentage === 0)}
        >
          <div className="absolute inset-0 border-r border-[#1e1e1e] flex flex-col">
            <div className="h-9 px-4 flex items-center justify-between text-[11px] font-medium text-[#bbbbbb] uppercase tracking-wider shrink-0 bg-[#252526]">
              <span>{activeActivity === 'explorer' ? 'Explorer' : activeActivity.toUpperCase()}</span>
              <div className="flex items-center gap-1">
                <MoreHorizontal className="w-4 h-4 text-[#858585] hover:text-white cursor-pointer" />
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <Sidebar 
                sessions={sessions}
                activeSessionId={activeSessionId}
                onSelectSession={setActiveSessionId}
                onNewSession={handleNewSession}
                onDeleteSession={handleDeleteSession}
              />
            </div>
          </div>
        </Panel>

        <Separator className="w-px bg-[#222] hover:bg-emerald-500/20 transition-colors cursor-col-resize z-50 shrink-0" />

        {/* MAIN WORKSPACE */}
        <Panel 
          id="content-panel" 
          minSize={0} 
          defaultSize={52} 
          className="relative bg-[#1e1e1e]"
        >
          <div className="absolute inset-0 flex flex-col">
            {/* Tab Bar */}
            <div className="h-9 bg-[#252526] flex items-center overflow-x-auto no-scrollbar shrink-0">
              <div 
                onClick={() => setActiveTab('python')}
                className={cn(
                  "h-full px-4 flex items-center gap-2 border-r border-[#1e1e1e] cursor-pointer text-[11px] min-w-[120px] transition-colors relative",
                  activeTab === 'python' ? "bg-[#1e1e1e] text-white" : "bg-[#2d2d2d] text-[#969696] hover:bg-[#1e1e1e]/50"
                )}
              >
                <div className="w-3.5 h-3.5 flex items-center justify-center text-blue-400">
                  <div className="text-[10px] font-bold">Py</div>
                </div>
                <span className="flex-1 truncate">script.py</span>
                {activeTab === 'python' && <div className="absolute top-0 left-0 right-0 h-px bg-[#007acc]" />}
                <X className="w-3 h-3 hover:bg-white/10 rounded-sm" />
              </div>
              <div 
                onClick={() => setActiveTab('react')}
                className={cn(
                  "h-full px-4 flex items-center gap-2 border-r border-[#1e1e1e] cursor-pointer text-[11px] min-w-[120px] transition-colors relative",
                  activeTab === 'react' ? "bg-[#1e1e1e] text-white" : "bg-[#2d2d2d] text-[#969696] hover:bg-[#1e1e1e]/50"
                )}
              >
                <Code className="w-3.5 h-3.5 text-cyan-400" />
                <span className="flex-1 truncate">interface.tsx</span>
                {activeTab === 'react' && <div className="absolute top-0 left-0 right-0 h-px bg-[#007acc]" />}
                <X className="w-3 h-3 hover:bg-white/10 rounded-sm" />
              </div>
              
              <div className="flex-1 h-full flex items-center justify-center pointer-events-none opacity-20">
                <span className="text-[10px] font-medium tracking-[0.2em]">{activeSession.title.toUpperCase()}</span>
              </div>
            </div>

            {/* Breadcrumbs */}
            <div className="h-6 bg-[#1e1e1e] border-b border-[#3c3c3c] flex items-center px-4 gap-1 text-[11px] text-[#858585] shrink-0">
              <span className="hover:text-white cursor-pointer">manim_projects</span>
              <ChevronRight className="w-3 h-3" />
              <span className="hover:text-white cursor-pointer">{activeSession.title.replace(/\s+/g, '_').toLowerCase()}</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-white">{activeTab === 'python' ? 'script.py' : 'interface.tsx'}</span>
            </div>

            {/* Viewports */}
            <div className="flex-1 relative">
              <Group orientation="vertical" id="viewport-group" className="absolute inset-0 h-full w-full">
                {/* PREVIEW */}
                {isPreviewVisible && (
                  <Panel id="preview-panel" defaultSize={60} minSize={0} className="relative">
                    <div className="absolute inset-0 flex flex-col p-px overflow-hidden">
                      <div className="flex-1 bg-[#000] overflow-hidden flex flex-col">
                        <div className="h-6 px-3 flex items-center border-b border-[#222] bg-[#050505]">
                          <span className="text-[9px] font-bold text-emerald-500/40 uppercase tracking-widest">VIDEO_OUTPUT</span>
                        </div>
                        <div className="flex-1 relative">
                          <Preview code={activeSession.currentProject.previewCode || ''} progress={progress} />
                        </div>
                      </div>
                      
                      {/* Modern Playback Console */}
                      <div className="h-12 bg-[#252526] border-t border-[#1e1e1e] px-4 flex items-center gap-4 shrink-0">
                        <button
                          onClick={() => setIsPlaying(!isPlaying)}
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                            isPlaying ? "bg-white/5 text-white hover:bg-white/10" : "bg-[#007acc] text-white hover:bg-[#118ad4]"
                          )}
                        >
                          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
                        </button>
                        
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-[10px] font-mono text-[#858585] w-12 text-center">
                            {(progress * 100).toFixed(1)}%
                          </span>
                          <div className="flex-1 h-1.5 bg-[#3c3c3c] rounded-full relative overflow-hidden group cursor-pointer" style={{ height: '6px' }}>
                            <input 
                              type="range" min="0" max="1" step="0.001" value={progress}
                              onChange={(e) => setProgress(parseFloat(e.target.value))}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div 
                              className="h-full bg-[#007acc] transition-all" 
                              style={{ width: `${progress * 100}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => {
                              const pr = prompt("Enter micro-adjustment instructions:");
                              if (pr) handleSendMessage(pr, true);
                            }}
                            className="px-3 py-1 bg-[#37373d] hover:bg-[#45454d] text-[11px] border border-[#3c3c3c] transition-colors"
                          >
                            Tweak Design
                          </button>
                        </div>
                      </div>
                    </div>
                  </Panel>
                )}

                {isPreviewVisible && isEditorVisible && (
                  <Separator className="h-px bg-[#222] hover:bg-emerald-500/20 transition-colors cursor-row-resize z-50 shrink-0" />
                )}

                {/* EDITOR PANEL */}
                {isEditorVisible && (
                  <Panel id="editor-panel" defaultSize={40} minSize={0} className="relative">
                    <div className="absolute inset-0 flex flex-col bg-[#1e1e1e]">
                      <div className="flex-1 relative">
                        <CodeEditor 
                          code={localCode} 
                          onChange={handleLocalCodeChange}
                          onLineClick={handleLineClick}
                          theme={settings.theme}
                          language={activeTab === 'python' ? 'python' : 'javascript'}
                        />
                        
                        {hasUnsavedChanges && (
                          <div className="absolute bottom-6 right-6 z-20 flex flex-col items-end gap-2">
                             <div className="bg-[#252526] border border-[#3c3c3c] px-3 py-2 shadow-2xl flex items-center gap-3">
                               <div className="flex flex-col">
                                 <span className="text-[10px] font-bold text-[#858585] uppercase">Local Changes</span>
                                 <span className="text-[11px] text-white">Sync with renderer?</span>
                               </div>
                               <button 
                                onClick={handleReRender}
                                disabled={isLoading}
                                className="bg-[#007acc] hover:bg-[#118ad4] text-white px-4 py-1.5 text-[11px] font-medium transition-colors"
                              >
                                {isLoading ? "Processing..." : "Commit changes"}
                              </button>
                             </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Editor Status Bar */}
                      <div className="h-6 bg-[#007acc] text-white flex items-center px-4 justify-between text-[11px] shrink-0">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5 font-bold">
                            <Brain className="w-3.5 h-3.5" />
                            <span>AI SYNC READY</span>
                          </div>
                          <span>UTF-8</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span>Spaces: 4</span>
                          <span>Line {(progress * 100).toFixed(0)}, Column 1</span>
                          <span className="font-bold">{activeTab === 'python' ? 'Python' : 'TypeScript JSX'}</span>
                        </div>
                      </div>
                    </div>
                  </Panel>
                )}
              </Group>
            </div>
          </div>
        </Panel>

        <Separator className="w-0.5 bg-[#1e1e1e]/50 hover:bg-[#007acc] transition-colors cursor-col-resize z-50 shrink-0" />

        {/* AI INTERFACE (CHAT) */}
        <Panel 
          id="chat-panel" 
          panelRef={chatPanelRef}
          defaultSize={30} 
          minSize={0} 
          collapsible
          className="relative bg-[#252526]"
          onResize={(size) => setIsChatCollapsed(size.asPercentage === 0)}
        >
          <div className="absolute inset-0 flex flex-col bg-[#1e1e1e] overflow-hidden border-l border-[#3c3c3c]">
            <Chat 
              messages={activeSession.messages}
              isLoading={isLoading}
              onSendMessage={(content) => handleSendMessage(content)}
              onAnimationGenerated={() => {}}
            />
          </div>
        </Panel>
      </Group>
    </div>
  );
}

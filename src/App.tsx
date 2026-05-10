import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Code, Eye, Layers, Settings2, Download, Copy, Check, Menu, MessageSquare, Play, Pause, GripHorizontal } from 'lucide-react';
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

  const activeSession = sessions.find(s => s.id === activeSessionId);

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

  // Refs for panels
  const sidebarPanelRef = useRef<PanelImperativeHandle>(null);
  const chatPanelRef = useRef<PanelImperativeHandle>(null);

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

  if (!activeSession) return null;

  return (
    <div className="flex h-screen w-full bg-[#0A0A0A] text-white font-sans overflow-hidden antialiased select-none">
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={setSettings}
      />

      <Group 
        orientation="horizontal" 
        className="flex-1 h-full w-full overflow-hidden min-w-0 min-h-0" 
        id="main-app-layout"
      >
        {/* SESSIONS SIDEBAR */}
        <Panel 
          id="sidebar-panel"
          panelRef={sidebarPanelRef}
          defaultSize={20} 
          minSize={0} 
          collapsible
          className="relative min-w-0 min-h-0 z-10"
          onResize={(size) => setIsSidebarCollapsed(size.asPercentage === 0)}
        >
          <div className="absolute inset-0 border-r border-white/5 overflow-hidden flex flex-col min-w-0 min-h-0">
            <Sidebar 
              sessions={sessions}
              activeSessionId={activeSessionId}
              onSelectSession={setActiveSessionId}
              onNewSession={handleNewSession}
              onDeleteSession={handleDeleteSession}
            />
          </div>
        </Panel>

        <Separator className="w-1 bg-[#111] hover:bg-purple-500/30 transition-colors flex items-center justify-center group cursor-col-resize z-50 shrink-0">
          <div className="w-[1px] h-10 bg-white/10 group-hover:bg-purple-500/50 transition-colors" />
        </Separator>

        {/* MAIN WORKSPACE */}
        <Panel 
          id="content-panel" 
          minSize={0} 
          defaultSize={50} 
          className="relative min-w-0"
        >
          <div className="absolute inset-0 flex flex-col bg-[#050505] overflow-hidden">
            {/* Elegant Header */}
            <header className="h-14 border-b border-white/5 flex items-center justify-between px-4 bg-[#0A0A0A]/30 backdrop-blur-xl z-20 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <button 
                  onClick={toggleSidebar}
                  className={cn(
                    "p-2 rounded-xl transition-all shrink-0",
                    !isSidebarCollapsed 
                      ? "text-white/20 hover:text-white hover:bg-white/5" 
                      : "bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-lg shadow-purple-500/10"
                  )}
                >
                  <Menu className="w-4 h-4" />
                </button>
                
                <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5 min-w-0 overflow-hidden">
                  <div className="flex bg-white/5 rounded-lg p-0.5 mr-2">
                    <button 
                      onClick={() => setActiveTab('python')}
                      className={cn(
                        "px-2 py-1 text-[9px] font-bold rounded-md transition-all",
                        activeTab === 'python' ? "bg-white/10 text-white shadow-sm" : "text-white/30 hover:text-white/50"
                      )}
                    >
                      PYTHON
                    </button>
                    <button 
                      onClick={() => setActiveTab('react')}
                      className={cn(
                        "px-2 py-1 text-[9px] font-bold rounded-md transition-all",
                        activeTab === 'react' ? "bg-white/10 text-white shadow-sm" : "text-white/30 hover:text-white/50"
                      )}
                    >
                      REACT
                    </button>
                  </div>
                  <div className="px-3 py-1 items-center gap-2 hidden lg:flex shrink-0">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest truncate max-w-[150px]">
                      {activeSession.title}
                    </span>
                  </div>
                  <div className="h-4 w-px bg-white/5 hidden lg:block" />
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setIsPreviewVisible(!isPreviewVisible)}
                      className={cn(
                        "p-1.5 rounded-lg transition-all",
                        isPreviewVisible ? "bg-white/10 text-white" : "text-white/20 hover:text-white/40"
                      )}
                      title="预览 (Ctrl+P)"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setIsEditorVisible(!isEditorVisible)}
                      className={cn(
                        "p-1.5 rounded-lg transition-all",
                        isEditorVisible ? "bg-white/10 text-white" : "text-white/20 hover:text-white/40"
                      )}
                      title="源码 (Ctrl+E)"
                    >
                      <Code className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <button 
                  onClick={() => copyToClipboard(activeSession.currentProject.manimCode || '')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/60 hover:text-white transition-all shrink-0 active:scale-95"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest">{copied ? '已复制' : '复制 Python'}</span>
                </button>
                
                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white/30 hover:text-white shrink-0"
                >
                  <Settings2 className="w-4 h-4" />
                </button>

                <button 
                  onClick={toggleChat}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border shrink-0 active:scale-95",
                    !isChatCollapsed 
                      ? "bg-purple-600/10 border-purple-500/30 text-purple-400" 
                      : "bg-white/5 border-white/5 text-white/30 hover:text-white"
                  )}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="hidden md:inline uppercase tracking-widest">AI</span>
                </button>
              </div>
            </header>

            {/* Viewports */}
            <div className="flex-1 relative min-h-0 min-w-0">
              <Group orientation="vertical" id="viewport-group" className="absolute inset-0 h-full w-full overflow-hidden min-h-0 min-w-0">
                {/* PREVIEW */}
                {isPreviewVisible && (
                  <Panel id="preview-panel" defaultSize={60} minSize={0} className="relative min-h-0">
                    <div className="absolute inset-0 flex flex-col p-4 overflow-hidden">
                      <div className="flex-1 min-h-0 relative bg-black rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
                        <Preview code={activeSession.currentProject.previewCode || ''} progress={progress} />
                      </div>
                      
                      {/* Integrated Playback Bar */}
                      <div className="h-14 mt-4 shrink-0 flex items-center gap-4 bg-white/[0.02] backdrop-blur-md rounded-2xl px-5 border border-white/5 overflow-hidden">
                        <button
                          onClick={() => setIsPlaying(!isPlaying)}
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 active:scale-95",
                            isPlaying ? "bg-white/10 text-white" : "bg-purple-500 text-white shadow-lg shadow-purple-500/20"
                          )}
                        >
                          {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 ml-1 fill-current" />}
                        </button>
                        
                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                          <div className="flex justify-between items-center px-1">
                            <span className="text-[9px] font-mono font-bold text-white/40 tracking-widest uppercase">Timeline</span>
                            <span className="text-[9px] font-mono font-bold text-purple-400">{(progress * 100).toFixed(1)}%</span>
                          </div>
                          <input 
                            type="range" min="0" max="1" step="0.001" value={progress}
                            onChange={(e) => setProgress(parseFloat(e.target.value))}
                            className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-purple-500 outline-none"
                          />
                        </div>

                        <button 
                          onClick={() => {
                            const pr = prompt("描述你想在当前时刻进行的视觉微调：");
                            if (pr) handleSendMessage(pr, true);
                          }}
                          className="px-4 h-10 bg-purple-500/10 hover:bg-purple-500/20 text-[10px] font-bold text-purple-400 uppercase tracking-widest border border-purple-500/20 rounded-xl transition-all active:scale-95 shrink-0"
                        >
                          微调
                        </button>
                      </div>
                    </div>
                  </Panel>
                )}

                {isPreviewVisible && isEditorVisible && (
                  <Separator className="h-1 bg-[#111] hover:bg-purple-500/20 transition-colors flex items-center justify-center group cursor-row-resize z-50 shrink-0">
                    <GripHorizontal className="w-3 h-3 text-white/5 group-hover:text-purple-500/40" />
                  </Separator>
                )}

                {/* EDITOR PANEL */}
                {isEditorVisible && (
                  <Panel id="editor-panel" defaultSize={40} minSize={0} className="relative min-h-0">
                    <div className="absolute inset-0 flex flex-col p-4 overflow-hidden">
                      <div className="flex-1 rounded-2xl overflow-hidden border border-white/5 bg-[#0D0D0D]/30 relative group shadow-inner">
                        <div className="absolute top-3 left-4 z-10 flex items-center gap-2 opacity-30 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <Code className="w-3 h-3" />
                          <span className="text-[9px] font-bold uppercase tracking-[0.3em]">
                            {activeTab === 'python' ? 'Python Source' : 'React Component (Live)'}
                          </span>
                        </div>
                        
                        <CodeEditor 
                          code={localCode} 
                          onChange={handleLocalCodeChange}
                          onLineClick={handleLineClick}
                          theme={settings.theme}
                          language={activeTab === 'python' ? 'python' : 'javascript'}
                        />
                        
                        <AnimatePresence>
                          {hasUnsavedChanges && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              className="absolute bottom-5 right-5 z-20 flex items-center gap-4 bg-purple-600 px-4 py-2.5 rounded-2xl shadow-2xl border border-white/10"
                            >
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-white leading-none uppercase tracking-widest">已在本地修改</span>
                                <span className="text-[8px] text-white/50 mt-1 uppercase tracking-tighter text-left">渲染预览？</span>
                              </div>
                              <button 
                                onClick={handleReRender}
                                disabled={isLoading}
                                className="bg-white text-purple-600 px-4 py-1.5 rounded-xl text-[10px] font-black hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shrink-0"
                              >
                                {isLoading ? '...' : '立即渲染'}
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </Panel>
                )}
              </Group>

              {!isPreviewVisible && !isEditorVisible && (
                <div className="absolute inset-0 flex items-center justify-center text-white/5 uppercase tracking-[1em] font-black text-[10px] pointer-events-none">
                  EMPTY
                </div>
              )}
            </div>
          </div>
        </Panel>

        <Separator className="w-1 bg-[#111] hover:bg-purple-500/30 transition-colors flex items-center justify-center group cursor-col-resize z-50 shrink-0">
          <div className="w-[1px] h-10 bg-white/10 group-hover:bg-purple-500/50 transition-colors" />
        </Separator>

        {/* AI SIDEBAR */}
        <Panel 
          id="chat-panel" 
          panelRef={chatPanelRef}
          defaultSize={30} 
          minSize={0} 
          collapsible
          className="relative z-10"
          onResize={(size) => setIsChatCollapsed(size.asPercentage === 0)}
        >
          <div className="absolute inset-0 flex flex-col bg-[#080808] overflow-hidden border-l border-white/5">
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

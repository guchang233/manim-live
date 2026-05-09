import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Code, Eye, Layers, Settings2, Download, Copy, Check, Menu, MessageSquare, Play, Pause, GripVertical, GripHorizontal } from 'lucide-react';
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
  previewCode: '() => <div className="text-white/20">暂无预览</div>',
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
        return JSON.parse(saved);
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
  const [localCode, setLocalCode] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Refs for panels
  const sidebarPanelRef = useRef<PanelImperativeHandle>(null);
  const chatPanelRef = useRef<PanelImperativeHandle>(null);

  useEffect(() => {
    if (activeSession) {
      const code = activeSession.currentProject.manimCode || '';
      setLocalCode(code);
      setHasUnsavedChanges(false);
    }
  }, [activeSessionId, activeSession?.currentProject.manimCode]);

  const handleLocalCodeChange = (val: string | undefined) => {
    const newVal = val || '';
    setLocalCode(newVal);
    setHasUnsavedChanges(newVal !== activeSession?.currentProject.manimCode);
  };

  const handleReRender = async () => {
    if (!activeSession) return;
    setIsLoading(true);
    try {
      updateSession(activeSession.id, {
        currentProject: {
          ...activeSession.currentProject,
          manimCode: localCode
        }
      });
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
        direction="horizontal" 
        className="flex-1 h-full w-full overflow-hidden min-w-0 min-h-0" 
        id="main-app-layout"
      >
        {/* SESSIONS SIDEBAR */}
        <Panel 
          id="sidebar-panel"
          order={0}
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
        <Panel id="content-panel" order={1} minSize={0} defaultSize={50} className="relative min-w-0 min-h-0 flex-1 z-0">
          <div className="absolute inset-0 flex flex-col bg-[#050505] overflow-hidden min-w-0 min-h-0">
            {/* Minimal Header */}
            <header className="h-12 border-b border-white/5 flex items-center justify-between px-3 bg-[#0A0A0A]/50 backdrop-blur-sm z-10 shrink-0 min-w-0 overflow-hidden">
              <div className="flex items-center gap-1.5 min-w-0 overflow-hidden shrink-0">
                <button 
                  onClick={toggleSidebar}
                  className={cn(
                    "p-1.5 rounded-md transition-colors shrink-0",
                    !isSidebarCollapsed ? "text-white/30 hover:text-white hover:bg-white/5" : "bg-purple-500/20 text-purple-400"
                  )}
                >
                  <Menu className="w-3.5 h-3.5" />
                </button>
                
                <div className="flex items-center gap-0.5 bg-white/5 p-0.5 rounded-md border border-white/5 min-w-0 overflow-hidden shrink-0">
                  <span className="hidden md:block px-2 text-[10px] font-bold text-white/20 uppercase tracking-widest truncate max-w-[60px]">
                    {activeSession.title}
                  </span>
                  <div className="flex items-center shrink-0">
                    <button
                      onClick={() => setIsPreviewVisible(!isPreviewVisible)}
                      className={cn(
                        "p-1.5 rounded-sm transition-all",
                        isPreviewVisible ? "bg-white/10 text-white" : "text-white/20 hover:text-white/40"
                      )}
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setIsEditorVisible(!isEditorVisible)}
                      className={cn(
                        "p-1.5 rounded-sm transition-all",
                        isEditorVisible ? "bg-white/10 text-white" : "text-white/20 hover:text-white/40"
                      )}
                    >
                      <Code className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-auto overflow-hidden">
                <button 
                  onClick={() => copyToClipboard(activeSession.currentProject.manimCode || '')}
                  className="flex items-center gap-1.5 px-2 py-1 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 rounded-md text-purple-400 transition-all shrink-0"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span className="hidden lg:inline text-[9px] font-bold uppercase tracking-widest">{copied ? '已复制' : '复制'}</span>
                </button>
                
                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-1.5 hover:bg-white/5 rounded-md transition-colors text-white/30 hover:text-white shrink-0"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                </button>

                <button 
                  onClick={toggleChat}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-bold transition-all border shrink-0",
                    !isChatCollapsed 
                      ? "bg-purple-500/20 border-purple-500/40 text-purple-400" 
                      : "bg-white/5 border-white/5 text-white/30 hover:text-white"
                  )}
                >
                  <MessageSquare className="w-3 h-3" />
                  <span className="hidden sm:inline uppercase">AI</span>
                </button>
              </div>
            </header>

            {/* Viewports */}
            <div className="flex-1 relative min-h-0 min-w-0">
              <Group orientation="vertical" id="viewport-group" className="absolute inset-0 h-full w-full overflow-hidden min-h-0 min-w-0">
                {/* PREVIEW */}
                {isPreviewVisible && (
                  <Panel id="preview-panel" defaultSize={60} minSize={0} className="relative min-h-0 min-w-0">
                    <div className="absolute inset-0 flex flex-col p-2 sm:p-3 overflow-hidden min-h-0 min-w-0">
                      <div className="flex-1 min-h-0 min-w-0 relative bg-black rounded-lg overflow-hidden border border-white/5 shadow-2xl">
                        <Preview code={activeSession.currentProject.previewCode || ''} progress={progress} />
                      </div>
                      
                      {/* Controller */}
                      <div className="h-10 mt-2 shrink-0 flex items-center gap-2 sm:gap-3 bg-white/[0.03] rounded-lg px-2 sm:px-3 border border-white/5 min-w-0 overflow-hidden">
                        <button
                          onClick={() => setIsPlaying(!isPlaying)}
                          className="w-7 h-7 rounded-full flex items-center justify-center bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 shrink-0"
                        >
                          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                        </button>
                        <span className="text-[9px] font-mono text-white/30 shrink-0 w-8 text-center truncate">
                          {(progress * 100).toFixed(0)}%
                        </span>
                        <input 
                          type="range" min="0" max="1" step="0.001" value={progress}
                          onChange={(e) => setProgress(parseFloat(e.target.value))}
                          className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-purple-500 outline-none min-w-0"
                        />
                        <button 
                          onClick={() => {
                            const pr = prompt("请输入调整建议：");
                            if (pr) handleSendMessage(pr, true);
                          }}
                          className="px-2 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-[8px] font-bold text-purple-400 uppercase border border-purple-500/20 rounded-md shrink-0"
                        >
                          <span className="hidden sm:inline">微调</span>
                          <span className="sm:hidden">FIX</span>
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

                {/* EDITOR */}
                {isEditorVisible && (
                  <Panel id="editor-panel" defaultSize={40} minSize={0} className="relative min-h-0 min-w-0">
                    <div className="absolute inset-0 flex flex-col p-2 sm:p-3 overflow-hidden min-h-0 min-w-0">
                      <div className="flex-1 rounded-lg overflow-hidden border border-white/5 bg-[#0D0D0D]/30 relative min-h-0 min-w-0">
                        <CodeEditor 
                          code={localCode} 
                          onChange={handleLocalCodeChange}
                          onLineClick={handleLineClick}
                          theme={settings.theme}
                        />
                        
                        <AnimatePresence>
                          {hasUnsavedChanges && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="absolute bottom-3 right-3 z-20 flex items-center gap-3 bg-purple-600 px-2 py-1.5 rounded-lg shadow-xl border border-white/10"
                            >
                              <span className="text-[8px] sm:text-[9px] font-bold text-white uppercase tracking-wider truncate">已更改</span>
                              <button 
                                onClick={handleReRender}
                                disabled={isLoading}
                                className="bg-white text-purple-600 px-2 py-1 rounded-md text-[8px] sm:text-[9px] font-black hover:bg-white/90 disabled:opacity-50 shrink-0"
                              >
                                {isLoading ? '...' : '刷新'}
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
          order={2}
          panelRef={chatPanelRef}
          defaultSize={30} 
          minSize={0} 
          collapsible
          className="relative min-w-0 min-h-0 z-10"
          onResize={(size) => setIsChatCollapsed(size.asPercentage === 0)}
        >
          <div className="absolute inset-0 flex flex-col bg-[#0D0D0D] overflow-hidden min-w-0 min-h-0 border-l border-white/5">
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

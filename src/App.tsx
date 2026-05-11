import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Code, Eye, Settings2, Download, Copy, Check, Menu, MessageSquare, Play, Pause, GripHorizontal, Square, Terminal, Files, Search, Brain, HelpCircle, X, ChevronRight, MoreHorizontal, RotateCcw } from 'lucide-react';
import { Panel, Group, Separator, PanelImperativeHandle } from 'react-resizable-panels';
import Chat from './components/Chat';
import Sidebar from './components/Sidebar';
import SearchSidebar from './components/SearchSidebar';
import CodeEditor from './components/Editor';
import Preview from './components/Preview';
import SettingsModal from './components/SettingsModal';
import { ChatMessage, ManimProject, Session, UserSettings, DEFAULT_SETTINGS } from './types';
import { generateAnimation } from './services/gemini';
import { cn } from './lib/utils';

const DEFAULT_PROJECT = {
  manimCode: '# 您的 Manim 代码将显示在这里',
  previewCode: 'export default () => <div className="text-white/20 p-8 text-center text-xs font-mono uppercase tracking-widest leading-loose">等待首次生成</div>',
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
        // Ensure default settings are merged for safety
        const merged = { ...DEFAULT_SETTINGS, ...parsed };
        if (['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'].includes(merged.model)) {
          merged.model = DEFAULT_SETTINGS.model;
        }
        return merged;
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
      ? activeSession?.currentProject?.manimCode 
      : activeSession?.currentProject?.previewCode;
      
    setHasUnsavedChanges(newVal !== originalCode);
    
    if (activeTab === 'react' && activeSession && activeSession.currentProject) {
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
      if (activeTab === 'python' && activeSession.currentProject) {
        updateSession(activeSession.id, {
          currentProject: {
            ...activeSession.currentProject,
            manimCode: localCode
          }
        });
      } else if (activeSession.currentProject) {
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
          const next = prev + 0.005; // Slightly slower for smoother play
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
      title: '新动画项目',
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
      finalContent = `在进度 ${(progress * 100).toFixed(0)}% 处，执行此调整：${content}`;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: finalContent
    };
    
    const newMessages = [...(activeSession.messages || []), userMessage];
    updateSession(activeSession.id, { messages: newMessages });
    setIsLoading(true);

    try {
      const history = (activeSession.messages || []).map(m => ({ role: m.role, content: m.content }));
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
        content: "抱歉，遇到了一些错误。请稍后再试。"
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
      <div className="h-screen w-full bg-[#1e1e1e] flex flex-col items-center justify-center gap-4 font-mono">
        <div className="w-12 h-12 border border-[#3c3c3c] flex items-center justify-center animate-pulse">
          <Terminal className="text-[#007acc] w-6 h-6" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-white font-bold text-lg tracking-widest uppercase">MANIM_STUDIO_AI</h1>
          <span className="text-[10px] text-[#858585] uppercase tracking-[0.4em]">工作站加载中...</span>
        </div>
      </div>
    );
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleActivityClick = (activity: 'explorer' | 'search' | 'ai') => {
    if (activity === 'explorer' || activity === 'search') {
      const panel = sidebarPanelRef.current;
      if (activeActivity === activity && !panel?.isCollapsed()) {
        panel?.collapse();
      } else {
        setActiveActivity(activity);
        panel?.expand();
      }
    } else if (activity === 'ai') {
      const panel = chatPanelRef.current;
      if (panel?.isCollapsed()) {
        panel?.expand();
      } else {
        panel?.collapse();
      }
    }
  };

  const isLight = settings.theme === 'light';

  return (
    <div className={cn(
      "flex h-screen w-full font-sans overflow-hidden select-none transition-colors duration-300",
      isLight ? "theme-light text-[#333] bg-white" : "bg-[#1e1e1e] text-[#cccccc]"
    )}>
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={setSettings}
      />

      {/* ACTIVITY BAR */}
      <div className="w-12 bg-[var(--bg-activity)] border-r border-[var(--border)] flex flex-col items-center py-2 gap-4 shrink-0 z-50">
        <div 
          onClick={() => handleActivityClick('explorer')}
          className={cn(
            "p-2.5 cursor-pointer transition-colors relative group",
            activeActivity === 'explorer' && !isSidebarCollapsed ? "text-white" : "text-[#858585] hover:text-white"
          )}
        >
          <Files className="w-6 h-6" />
          {activeActivity === 'explorer' && !isSidebarCollapsed && <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-white" />}
        </div>
        <div 
          onClick={() => handleActivityClick('search')}
          className={cn(
            "p-2.5 cursor-pointer transition-colors relative",
            activeActivity === 'search' && !isSidebarCollapsed ? "text-white" : "text-[#858585] hover:text-white"
          )}
        >
          <Search className="w-6 h-6" />
          {activeActivity === 'search' && !isSidebarCollapsed && <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-white" />}
        </div>
        <div 
          onClick={() => handleActivityClick('ai')}
          className={cn(
            "p-2.5 cursor-pointer transition-colors relative",
            !isChatCollapsed ? "text-white" : "text-[#858585] hover:text-white"
          )}
        >
          <Brain className="w-6 h-6" />
          {!isChatCollapsed && <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-white" />}
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
        {/* SIDEBAR (FILE EXPLORER / SEARCH) */}
        <Panel 
          id="sidebar-panel"
          panelRef={sidebarPanelRef}
          defaultSize={18} 
          minSize={12} 
          collapsible
          className="relative bg-[var(--bg-side)]"
          onResize={(size) => setIsSidebarCollapsed(size.asPercentage === 0)}
        >
          <div className="absolute inset-0 border-r border-[var(--border)] flex flex-col">
            <div className="h-9 px-4 flex items-center justify-between text-[11px] font-medium text-[var(--text-sub)] uppercase tracking-wider shrink-0 bg-[var(--bg-side)]">
              <span>{activeActivity === 'explorer' ? '资源管理器' : '搜索'}</span>
              <div className="flex items-center gap-1">
                <MoreHorizontal className="w-4 h-4 text-[var(--text-sub)] hover:text-[var(--text-main)] cursor-pointer" />
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden">
              {activeActivity === 'explorer' ? (
                <Sidebar 
                  sessions={sessions}
                  activeSessionId={activeSessionId}
                  onSelectSession={setActiveSessionId}
                  onNewSession={handleNewSession}
                  onDeleteSession={handleDeleteSession}
                />
              ) : (
                <SearchSidebar 
                  sessions={sessions}
                  onSelectSession={setActiveSessionId}
                />
              )}
            </div>
          </div>
        </Panel>

        <Separator className="w-px bg-[var(--border)] hover:bg-[var(--accent)] transition-colors cursor-col-resize z-50 shrink-0 opacity-20" />

        {/* MAIN WORKSPACE */}
        <Panel 
          id="content-panel" 
          minSize={20} 
          defaultSize={52} 
          className="relative bg-[var(--bg-editor)]"
        >
          <div className="absolute inset-0 flex flex-col">
            {/* Tab Bar */}
            <div className="h-9 bg-[var(--bg-side)] flex items-center overflow-x-auto no-scrollbar shrink-0 border-b border-[var(--border)]/30">
              <div 
                onClick={() => setActiveTab('python')}
                className={cn(
                  "h-full px-4 flex items-center gap-2 border-r border-[var(--border)] cursor-pointer text-[11px] min-w-[120px] transition-colors relative",
                  activeTab === 'python' ? "bg-[var(--bg-editor)] text-[var(--text-main)]" : "bg-[var(--bg-side)] text-[var(--text-sub)] hover:bg-[var(--bg-editor)]/50"
                )}
              >
                <div className="w-3.5 h-3.5 flex items-center justify-center text-blue-500">
                  <div className="text-[10px] font-bold">Py</div>
                </div>
                <span className="flex-1 truncate">script.py</span>
                {activeTab === 'python' && <div className="absolute top-0 left-0 right-0 h-px bg-[var(--accent)]" />}
                <X className="w-3 h-3 hover:bg-white/10 rounded-sm" />
              </div>
              <div 
                onClick={() => setActiveTab('react')}
                className={cn(
                  "h-full px-4 flex items-center gap-2 border-r border-[var(--border)] cursor-pointer text-[11px] min-w-[120px] transition-colors relative",
                  activeTab === 'react' ? "bg-[var(--bg-editor)] text-[var(--text-main)]" : "bg-[var(--bg-side)] text-[var(--text-sub)] hover:bg-[var(--bg-editor)]/50"
                )}
              >
                <Code className="w-3.5 h-3.5 text-cyan-500" />
                <span className="flex-1 truncate">interface.tsx</span>
                {activeTab === 'react' && <div className="absolute top-0 left-0 right-0 h-px bg-[var(--accent)]" />}
                <X className="w-3 h-3 hover:bg-white/10 rounded-sm" />
              </div>
            </div>

            {/* Breadcrumbs */}
            <div className="h-6 bg-[var(--bg-editor)] border-b border-[var(--border)]/50 flex items-center px-4 gap-1 text-[11px] text-[var(--text-sub)] shrink-0">
              <span className="hover:text-[var(--text-main)] cursor-pointer">manim_projects</span>
              <ChevronRight className="w-3 h-3" />
              <span className="hover:text-[var(--text-main)] cursor-pointer text-white/40">{activeSession?.title?.replace(/\s+/g, '_').toLowerCase() || '未命名'}</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-[var(--text-main)]">{activeTab === 'python' ? 'script.py' : 'interface.tsx'}</span>
            </div>

            {/* Viewports */}
            <div className="flex-1 relative">
              <Group orientation="vertical" id="viewport-group" className="absolute inset-0 h-full w-full">
                {/* PREVIEW */}
                {isPreviewVisible && (
                  <Panel id="preview-panel" defaultSize={60} minSize={10} className="relative bg-black">
                    <div className="absolute inset-0 flex flex-col overflow-hidden">
                      <div className="flex-1 relative bg-black">
                        <Preview code={activeSession?.currentProject?.previewCode || ''} progress={progress} />
                      </div>
                      
                      {/* Robust Playback Console */}
                      <div className="h-10 bg-[#252526] border-t border-black/20 px-4 flex items-center gap-4 shrink-0 shadow-lg">
                        <div className="flex items-center gap-2">
                           <button
                             onClick={() => setProgress(0)}
                             className="p-1.5 text-[#858585] hover:text-white transition-colors"
                             title="重播"
                           >
                             <RotateCcw className="w-3.5 h-3.5" />
                           </button>
                           <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className={cn(
                              "w-7 h-7 rounded flex items-center justify-center transition-all",
                              isPlaying ? "bg-white/10 text-white" : "bg-[#007acc] text-white hover:bg-[#118ad4]"
                            )}
                          >
                            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />}
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-[10px] font-mono text-[#858585] w-9 text-right">
                            {(progress * 100).toFixed(0)}%
                          </span>
                          <div className="flex-1 h-1 bg-[#3c3c3c] rounded-full relative overflow-hidden group cursor-pointer">
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

                         <div className="flex items-center gap-2">
                           <button 
                             onClick={() => {
                               const pr = prompt("输入微调指令：");
                               if (pr) handleSendMessage(pr, true);
                             }}
                             className="px-2.5 py-1 text-[10px] bg-[#37373d] hover:bg-[#45454d] text-white border border-[#3c3c3c] rounded transition-colors"
                           >
                             微调帧
                           </button>
                         </div>
                      </div>
                    </div>
                  </Panel>
                )}

                {isPreviewVisible && isEditorVisible && (
                  <Separator className="h-px bg-[var(--border)] hover:bg-[var(--accent)] transition-colors cursor-row-resize z-50 shrink-0 opacity-20" />
                )}

                {/* EDITOR PANEL */}
                {isEditorVisible && (
                  <Panel id="editor-panel" defaultSize={40} minSize={10} className="relative">
                    <div className="absolute inset-0 flex flex-col bg-[var(--bg-editor)]">
                      <div className="flex-1 relative">
                        <CodeEditor 
                          code={localCode} 
                          onChange={handleLocalCodeChange}
                          onLineClick={handleLineClick}
                          theme={isLight ? 'vs' : 'vs-dark'}
                          language={activeTab === 'python' ? 'python' : 'javascript'}
                        />
                        
                        {hasUnsavedChanges && (
                          <div className="absolute bottom-6 right-6 z-20 flex flex-col items-end gap-2">
                             <div className="bg-[var(--bg-side)] border border-[var(--border)] px-3 py-2 shadow-2xl flex items-center gap-3">
                               <div className="flex flex-col">
                                 <span className="text-[10px] font-bold text-[var(--text-sub)] uppercase">已修改</span>
                                 <span className="text-[11px] text-[var(--text-main)]">同步到渲染器？</span>
                               </div>
                               <button 
                                onClick={handleReRender}
                                disabled={isLoading}
                                className="bg-[var(--accent)] hover:bg-[#118ad4] text-white px-4 py-1.5 text-[11px] font-medium transition-colors"
                              >
                                {isLoading ? "同步中..." : "同步更改"}
                              </button>
                             </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Editor Status Bar */}
                      <div className="h-6 bg-[var(--status-bg)] text-white flex items-center px-4 justify-between text-[11px] shrink-0 font-medium">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5">
                            <Brain className="w-3.5 h-3.5" />
                            <span>AI 同步就绪</span>
                          </div>
                          <span className="opacity-70">UTF-8</span>
                        </div>
                        <div className="flex items-center gap-4 opacity-70">
                          <span>空格: 4</span>
                          <span>行 {(progress * 100).toFixed(0)}, 列 1</span>
                          <span>{activeTab === 'python' ? 'Python' : 'TypeScript JSX'}</span>
                        </div>
                      </div>
                    </div>
                  </Panel>
                )}
              </Group>
            </div>
          </div>
        </Panel>

        <Separator className="w-0.5 bg-[var(--border)]/30 hover:bg-[var(--accent)] transition-colors cursor-col-resize z-50 shrink-0 opacity-20" />

        {/* AI INTERFACE (CHAT) */}
        <Panel 
          id="chat-panel" 
          panelRef={chatPanelRef}
          defaultSize={30} 
          minSize={15} 
          collapsible
          className="relative bg-[var(--bg-side)]"
          onResize={(size) => setIsChatCollapsed(size.asPercentage === 0)}
        >
          <div className="absolute inset-0 flex flex-col bg-[var(--bg-editor)] overflow-hidden border-l border-[var(--border)]/50">
            <Chat 
              messages={activeSession?.messages || []}
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

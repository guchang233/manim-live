import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Code, Eye, Layers, Settings2, Download, Copy, Check, Menu, MessageSquare, RefreshCw, Play, Pause } from 'lucide-react';
import Chat from './components/Chat';
import Sidebar from './components/Sidebar';
import CodeEditor from './components/Editor';
import Preview from './components/Preview';
import { ChatMessage, ManimProject, Session } from './types';
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

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return sessions.length > 0 ? sessions[0].id : '';
  });

  const activeSession = sessions.find(s => s.id === activeSessionId);

  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isPreviewVisible, setIsPreviewVisible] = useState(true);
  const [isEditorVisible, setIsEditorVisible] = useState(true);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState(0.5);
  const [isPlaying, setIsPlaying] = useState(false);
  const [localCode, setLocalCode] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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
      // Just update the project code to trigger a preview update if the component was reactive,
      // but here we might want to ask Gemini to verify/fix the React code based on Python changes.
      // For a simple version, we'll just commit the local code.
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
      // Brief delay to simulate "re-rendering" feel
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

  useEffect(() => {
    if (sessions.length === 0) {
      handleNewSession();
    }
  }, []);

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
      const result = await generateAnimation(finalContent, history);
      
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
      setActiveTab('preview');
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

  if (!activeSession) return null;

  return (
    <div className="flex h-screen bg-[#0A0A0A] text-white font-sans overflow-hidden">
      {/* Sessions Sidebar */}
      <motion.div
        initial={false}
        animate={{ 
          width: isSidebarOpen ? '260px' : '0px',
          opacity: isSidebarOpen ? 1 : 0
        }}
        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        className="shrink-0 overflow-hidden border-r border-white/5 bg-[#0D0D0D]"
      >
        <div className="w-[260px] h-full">
          <Sidebar 
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={setActiveSessionId}
            onNewSession={handleNewSession}
            onDeleteSession={handleDeleteSession}
          />
        </div>
      </motion.div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 border-r border-white/5 relative">
        {/* Navbar */}
      <header className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#0A0A0A]/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                isSidebarOpen ? "text-white/40 hover:text-white hover:bg-white/5" : "bg-purple-600/20 text-purple-400 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
              )}
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/5">
              <button
                onClick={() => setIsPreviewVisible(!isPreviewVisible)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1 rounded-md text-[10px] font-bold transition-all",
                  isPreviewVisible ? "bg-white/10 text-white" : "text-white/30 hover:text-white/50"
                )}
              >
                <Eye className="w-3 h-3" />
                预览
              </button>
              <button
                onClick={() => setIsEditorVisible(!isEditorVisible)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1 rounded-md text-[10px] font-bold transition-all",
                  isEditorVisible ? "bg-white/10 text-white" : "text-white/30 hover:text-white/50"
                )}
              >
                <Code className="w-3 h-3" />
                代码
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => copyToClipboard(activeSession.currentProject.manimCode || '')}
              className="flex items-center gap-2 px-3 py-1.5 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 rounded-lg text-[10px] font-bold text-purple-400 transition-all uppercase tracking-wider"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? '已复制' : '复制代码'}
            </button>
            <button 
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border",
                isChatOpen 
                  ? "bg-purple-600/10 border-purple-500/30 text-purple-400" 
                  : "bg-white/5 border-white/5 text-white/40 hover:text-white"
              )}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              AI 助手
            </button>
          </div>
        </header>

        {/* Dual Viewport */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Top Half: Preview */}
          {isPreviewVisible && (
            <div className={cn(
              "flex flex-col min-h-0 border-b border-white/5 p-4 gap-3 bg-[#0D0D0D]/30 transition-all",
              isEditorVisible ? "flex-[1.2]" : "flex-1"
            )}>
              <div className="flex items-center justify-between shrink-0">
                <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Eye className="w-3 h-3" />
                  可视化预览 ;
                </span>
              </div>
              
              <div className="flex-1 relative bg-black rounded-xl overflow-hidden border border-white/5 shadow-2xl">
                <Preview code={activeSession.currentProject.previewCode || ''} progress={progress} />
              </div>

              {/* Progress Controller */}
              <div className="shrink-0 flex items-center gap-4 bg-white/5 rounded-xl px-4 py-2 border border-white/5">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 transition-all"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>
                <span className="text-[10px] font-mono text-white/40 shrink-0 w-8">
                  {(progress * 100).toFixed(0)}%
                </span>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.001" 
                  value={progress}
                  onChange={(e) => setProgress(parseFloat(e.target.value))}
                  className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-purple-500 focus:outline-none"
                />
                <button 
                  onClick={() => {
                    const pr = prompt("请输入您想在当前时刻（" + (progress * 100).toFixed(0) + "%）进行的深入调整建议：");
                    if (pr) handleSendMessage(pr, true);
                  }}
                  className="px-2 py-1 rounded bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-[9px] font-bold text-purple-400 uppercase tracking-wider transition-all"
                >
                  在此处微调
                </button>
              </div>
            </div>
          )}

          {/* Bottom Half: Editor */}
          {isEditorVisible && (
            <div className="flex-1 flex flex-col min-h-0 p-4 gap-2">
              <div className="flex items-center justify-between shrink-0">
                <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Code className="w-3 h-3" />
                  Manim Python 源码 ;
                </span>
              </div>
              <div className="flex-1 rounded-xl overflow-hidden border border-white/5 relative group">
                <CodeEditor 
                  code={localCode} 
                  onChange={handleLocalCodeChange}
                  onLineClick={handleLineClick}
                />
                
                <AnimatePresence>
                  {hasUnsavedChanges && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="absolute bottom-6 right-6 z-10 flex items-center gap-3 bg-purple-600 px-4 py-2 rounded-xl shadow-2xl border border-white/20"
                    >
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-white/90 leading-none">代码已更改</span>
                        <span className="text-[8px] text-white/50 uppercase tracking-tighter">是否应用并刷新预览？</span>
                      </div>
                      <button 
                        onClick={handleReRender}
                        disabled={isLoading}
                        className="bg-white text-purple-600 px-3 py-1 rounded-lg text-[10px] font-bold hover:bg-white/90 transition-colors disabled:opacity-50"
                      >
                        {isLoading ? '渲染中...' : '立即渲染'}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
          {!isPreviewVisible && !isEditorVisible && (
            <div className="flex-1 flex items-center justify-center text-white/10 uppercase tracking-[0.5em] font-bold text-sm">
              工作区已清空
            </div>
          )}
        </div>
      </main>

      {/* AI Sidebar (Chat) */}
      <motion.div 
        initial={false}
        animate={{ width: isChatOpen ? '400px' : '0' }}
        className="shrink-0 overflow-hidden bg-[#0D0D0D]"
      >
        <div className="w-[400px] h-full">
          <Chat 
            messages={activeSession.messages}
            isLoading={isLoading}
            onSendMessage={(content) => handleSendMessage(content)}
            onAnimationGenerated={() => {}}
          />
        </div>
      </motion.div>
    </div>
  );
}

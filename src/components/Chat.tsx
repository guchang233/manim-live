import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Bot, Loader2, Play, Plus, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { cn } from '../lib/utils';
import { ChatMessage } from '../types';
import 'katex/dist/katex.min.css';

interface ChatProps {
  onAnimationGenerated: (result: { pythonCode: string; reactCode: string; explanation: string; refinedDescription: string }) => void;
  isLoading: boolean;
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
}

export default function Chat({ onAnimationGenerated, isLoading, messages, onSendMessage }: ChatProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-[#080808] w-full min-w-0">
      <div className="p-5 border-b border-white/5 flex items-center justify-between bg-[#0A0A0A]/50 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
            <Bot className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex flex-col min-w-0">
            <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em] leading-tight">Manim AI Core</h2>
            <span className="text-[8px] text-green-400/70 font-mono tracking-widest uppercase mt-0.5 animate-pulse">Online & Ready</span>
          </div>
        </div>
        <button className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white/20 hover:text-white">
          <BookOpen className="w-4 h-4" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-8 scroll-smooth custom-scrollbar">
        <AnimatePresence initial={false}>
          {messages.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center py-16 flex flex-col items-center"
            >
              <div className="w-20 h-20 bg-purple-500/5 rounded-3xl flex items-center justify-center mb-6 border border-purple-500/10 group">
                <Plus className="w-10 h-10 text-purple-500 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-sm font-bold text-white mb-2">欢迎来到 Manim Studio</h3>
              <p className="text-white/30 text-[10px] max-w-[200px] mx-auto uppercase tracking-widest leading-loose">
                描述您想要生成的数学动画，AI 将为您编写 Python 代码并同步预览。
              </p>
              
              <div className="grid grid-cols-1 gap-2 mt-8 w-full max-w-[240px]">
                {['一个脉动的分形圆', '傅里叶变换可视化', '勾股定理几何证明'].map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => onSendMessage(suggestion)}
                    className="text-[10px] font-bold text-left px-4 py-3 rounded-2xl bg-white/5 border border-white/5 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all text-white/40 hover:text-purple-300 group"
                  >
                    <span className="opacity-40 group-hover:opacity-100 transition-opacity mr-2">/</span>
                    {suggestion}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className={cn(
                "flex flex-col gap-3 w-full",
                message.role === 'user' ? "items-end pl-8" : "items-start pr-8"
              )}
            >
              <div className="flex items-center gap-2 px-1">
                {message.role === 'user' ? (
                  <>
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">User Profile</span>
                    <div className="w-5 h-5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                      <User className="w-3 h-3 text-white/40" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-5 h-5 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                      <Bot className="w-3 h-3 text-purple-400" />
                    </div>
                    <span className="text-[8px] font-black text-purple-400 uppercase tracking-[0.2em]">Studio Assistant</span>
                  </>
                )}
              </div>
              
              <div
                className={cn(
                   "p-4 rounded-3xl text-[13px] leading-relaxed relative group overflow-hidden",
                  message.role === 'user' 
                    ? "bg-purple-600 text-white rounded-tr-sm shadow-xl shadow-purple-600/10" 
                    : "bg-[#111111] text-white/90 border border-white/5 rounded-tl-sm shadow-2xl"
                )}
              >
                <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-black/30 prose-pre:border prose-pre:border-white/5 prose-code:text-purple-300">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-3 mr-auto items-start pr-8"
          >
            <div className="flex items-center gap-2 px-1">
              <div className="w-5 h-5 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
              </div>
              <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">Processing Stream...</span>
            </div>
            <div className="bg-[#111] text-white/80 border border-white/5 p-4 rounded-3xl rounded-tl-sm w-16 flex justify-center">
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="p-5 bg-[#0A0A0A] border-t border-white/5 shrink-0">
        <form onSubmit={handleSubmit} className="relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="请输入指令 (例如: 生成正弦波动画)..."
            className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-5 pr-14 text-white text-sm focus:outline-none focus:border-purple-500/50 transition-all font-medium placeholder:text-white/10"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={cn(
              "absolute right-2.5 top-2.5 w-9 h-9 rounded-xl flex items-center justify-center transition-all",
              input.trim() && !isLoading 
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20 hover:scale-105 active:scale-95" 
                : "text-white/10"
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-[8px] text-white/10 uppercase tracking-[0.3em] font-black">
            Manim Engine v2.0
          </p>
          <div className="flex items-center gap-1.5 grayscale opacity-30">
             <div className="w-3 h-3 bg-white/20 rounded-full" />
             <div className="w-3 h-3 bg-white/20 rounded-full" />
             <div className="w-3 h-3 bg-white/20 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

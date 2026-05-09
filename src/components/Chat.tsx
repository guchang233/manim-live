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
    <div className="flex flex-col h-full bg-[#161616] border-r border-white/10 w-full min-w-0">
      <div className="p-4 border-bottom border-white/5 flex items-center justify-between">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <Bot className="w-5 h-5 text-purple-400" />
          Manim AI 助手
        </h2>
        <div className="flex gap-2">
          <BookOpen className="w-4 h-4 text-white/40 cursor-help" />
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
        <AnimatePresence initial={false}>
          {messages.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center py-12 space-y-4"
            >
              <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-purple-400" />
              </div>
              <p className="text-white/60 text-sm max-w-[240px] mx-auto">
                今天想制作什么样的 Manim 动画？
              </p>
              <div className="grid grid-cols-1 gap-2 p-4">
                {['一个脉动的数学圆', '正弦波生成动画', '圆形变换为正方形'].map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => onSendMessage(suggestion)}
                    className="text-xs text-left p-2 rounded bg-white/5 border border-white/5 hover:bg-white/10 transition-colors text-white/50"
                  >
                    " {suggestion} "
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={cn(
                "flex flex-col gap-2 max-w-[85%] mb-6",
                message.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                {message.role === 'user' ? (
                  <>
                    <span className="text-[10px] text-white/40 uppercase tracking-widest">你</span>
                    <User className="w-4 h-4 text-white/40" />
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4 text-purple-400" />
                    <span className="text-[10px] text-white/40 uppercase tracking-widest">助手</span>
                  </>
                )}
              </div>
              <div
                className={cn(
                  "p-3 rounded-2xl text-sm leading-relaxed overflow-hidden",
                  message.role === 'user' 
                    ? "bg-purple-600 text-white rounded-tr-none shadow-[0_4px_12px_rgba(147,51,234,0.2)]" 
                    : "bg-white/5 text-white/80 border border-white/10 rounded-tl-none shadow-xl"
                )}
              >
                <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/5">
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
            className="flex flex-col gap-2 mr-auto items-start max-w-[85%]"
          >
            <div className="flex items-center gap-2 mb-1">
              <Bot className="w-4 h-4 text-purple-400" />
              <span className="text-[10px] text-white/40 uppercase tracking-widest">思考中...</span>
            </div>
            <div className="bg-white/5 text-white/80 border border-white/10 p-3 rounded-2xl rounded-tl-none">
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
            </div>
          </motion.div>
        )}
      </div>

      <div className="p-4 bg-black/20 border-t border-white/10">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="描述你的动画需求..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-white text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1.5 p-1.5 text-purple-400 hover:text-purple-300 disabled:text-white/20 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <p className="text-[10px] text-white/20 mt-3 text-center uppercase tracking-widest">
          AI 支持的 Manim 工作流 : v1.1
        </p>
      </div>
    </div>
  );
}

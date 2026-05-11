import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Bot, Loader2, Play, Plus, BookOpen, Terminal, Brain } from 'lucide-react';
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
    <div className="flex flex-col h-full bg-[#1e1e1e] w-full min-w-0 font-sans">
      <div className="h-9 px-3 border-b border-[#3c3c3c] flex items-center justify-between bg-[#1e1e1e] shrink-0">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-[#858585]" />
          <h2 className="text-[11px] font-medium text-[#bbbbbb] uppercase tracking-wider">AI Assistant</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
          <span className="text-[10px] text-[#858585] font-medium">Ready</span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-[#1e1e1e]">
        {messages.length === 0 && (
          <div className="py-8 flex flex-col items-start gap-4">
            <div className="text-[12px] text-[#858585] leading-relaxed">
              <p className="font-medium text-white mb-2">Welcome to AI Animation Assistant</p>
              <p>Type instructions to generate or modify Manim animations. You can tweak code in real-time or ask me to do it for you.</p>
            </div>
            
            <div className="flex flex-wrap gap-2 w-full">
              {['脉动分形', '傅里叶变换', '勾股定理可视化'].map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => onSendMessage(suggestion)}
                  className="text-[11px] px-3 py-1.5 rounded-md border border-[#3c3c3c] bg-[#252526] text-[#cccccc] hover:text-white hover:border-[#007acc] transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-6">
          {messages.map((message) => (
            <div key={message.id} className="flex gap-3">
              <div className="mt-1 shrink-0">
                {message.role === 'user' ? (
                  <div className="w-6 h-6 rounded-md bg-[#3c3c3c] flex items-center justify-center text-[10px] font-bold text-white">U</div>
                ) : (
                  <div className="w-6 h-6 rounded-md bg-[#007acc] flex items-center justify-center text-white"><Brain className="w-4 h-4" /></div>
                )}
              </div>
              
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-bold text-white">
                    {message.role === 'user' ? 'You' : 'Assistant'}
                  </span>
                  <span className="text-[10px] text-[#858585]">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                <div className="text-[13px] leading-relaxed text-[#cccccc]">
                  <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-[#252526] prose-pre:border prose-pre:border-[#3c3c3c] prose-code:text-blue-300">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {isLoading && (
          <div className="flex gap-3 animate-pulse">
            <div className="w-6 h-6 rounded-md bg-[#007acc]/20 flex items-center justify-center text-white/20"><Brain className="w-4 h-4" /></div>
            <div className="flex-1 flex flex-col gap-2">
              <div className="h-4 w-24 bg-[#3c3c3c] rounded" />
              <div className="h-4 w-full bg-[#3c3c3c] rounded" />
              <div className="h-4 w-2/3 bg-[#3c3c3c] rounded" />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-[#1e1e1e] border-t border-[#3c3c3c] shrink-0">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 bg-[#252526] border border-[#3c3c3c] rounded-md overflow-hidden focus-within:border-[#007acc]">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Ask me anything..."
            className="w-full bg-transparent p-3 text-white text-[13px] focus:outline-none placeholder:text-[#858585] resize-none min-h-[60px]"
          />
          <div className="flex items-center justify-between px-3 py-2 bg-[#2a2d2e] border-t border-[#3c3c3c]">
            <span className="text-[10px] text-[#858585]">Enter to send, Shift+Enter for new line</span>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={cn(
                "p-1.5 rounded transition-all",
                input.trim() && !isLoading 
                  ? "bg-[#007acc] text-white" 
                  : "text-[#858585]"
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

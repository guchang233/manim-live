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
    <div className="flex flex-col h-full bg-[var(--bg-editor)] w-full min-w-0 font-sans">
      <div className="h-9 px-3 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-editor)] shrink-0 opacity-80">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-[var(--text-sub)]" />
          <h2 className="text-[11px] font-medium text-[var(--text-main)] uppercase tracking-wider">AI Assistant</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
          <span className="text-[10px] text-[var(--text-sub)] font-medium">Synced</span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-[var(--bg-editor)]">
        {messages.length === 0 && (
          <div className="py-8 flex flex-col items-start gap-4">
            <div className="text-[12px] text-[var(--text-sub)] leading-relaxed">
              <p className="font-semibold text-[var(--text-main)] mb-2">Welcome to Manim Studio AI</p>
              <p>Type instructions to generate or modify animations. Use the "Tweak Frame" button in the player for micro-adjustments.</p>
            </div>
            
            <div className="flex flex-wrap gap-2 w-full">
              {['Fractal Pulse', 'Fourier Series', 'Pythagorean Theorem'].map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => onSendMessage(suggestion)}
                  className="text-[11px] px-3 py-1.5 rounded border border-[var(--border)] bg-[var(--bg-side)] text-[var(--text-main)] hover:border-[var(--accent)] transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-6">
          {messages.map((message) => (
            <div key={message.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="mt-1 shrink-0">
                {message.role === 'user' ? (
                  <div className="w-6 h-6 rounded bg-[var(--border)] flex items-center justify-center text-[10px] font-bold text-[var(--text-main)]">U</div>
                ) : (
                  <div className="w-6 h-6 rounded bg-[var(--accent)] flex items-center justify-center text-white"><Brain className="w-4 h-4" /></div>
                )}
              </div>
              
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-bold text-[var(--text-main)]">
                    {message.role === 'user' ? 'You' : 'Assistant'}
                  </span>
                  <span className="text-[10px] text-[var(--text-sub)] opacity-60">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                <div className="text-[13px] leading-relaxed text-[var(--text-main)] opacity-90">
                  <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-[var(--bg-side)] prose-pre:border prose-pre:border-[var(--border)] prose-code:text-[var(--accent)]">
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
            <div className="w-6 h-6 rounded bg-[var(--accent)]/20 flex items-center justify-center text-white/20"><Brain className="w-4 h-4" /></div>
            <div className="flex-1 flex flex-col gap-2">
              <div className="h-4 w-24 bg-[var(--border)] rounded opacity-50" />
              <div className="h-4 w-full bg-[var(--border)] rounded opacity-50" />
              <div className="h-4 w-2/3 bg-[var(--border)] rounded opacity-50" />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-[var(--bg-editor)] border-t border-[var(--border)]/50 shrink-0">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 bg-[var(--bg-side)] border border-[var(--border)] rounded overflow-hidden focus-within:border-[var(--accent)] transition-colors shadow-sm">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Describe an animation..."
            className="w-full bg-transparent p-3 text-[var(--text-main)] text-[13px] focus:outline-none placeholder:text-[var(--text-sub)] resize-none min-h-[70px]"
          />
          <div className="flex items-center justify-between px-3 py-2 bg-[var(--bg-editor)]/50 border-t border-[var(--border)]/50">
            <span className="text-[10px] text-[var(--text-sub)] opacity-60">Enter to send, Shift+Enter for new line</span>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={cn(
                "p-1.5 rounded transition-all",
                input.trim() && !isLoading 
                  ? "bg-[var(--accent)] text-white" 
                  : "text-[var(--text-sub)]"
              )}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

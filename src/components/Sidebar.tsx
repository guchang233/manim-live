import React from 'react';
import { Plus, MessageSquare, Trash2, Clock, Search } from 'lucide-react';
import { Session } from '../types';
import { cn } from '../lib/utils';

interface SidebarProps {
  sessions: Session[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
}

export default function Sidebar({ sessions, activeSessionId, onSelectSession, onNewSession, onDeleteSession }: SidebarProps) {
  return (
    <div className="h-full bg-[#080808] border-r border-white/5 flex flex-col min-w-0">
      <div className="p-5">
        <button
          onClick={onNewSession}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-purple-600 hover:bg-purple-500 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all group active:scale-95 shadow-lg shadow-purple-600/20"
        >
          <Plus className="w-4 h-4 text-white group-hover:rotate-90 transition-transform" />
          开启新创作
        </button>
      </div>

      <div className="px-5 mb-4">
        <div className="relative group">
          <Search className="absolute left-3.5 top-3 w-3.5 h-3.5 text-white/20 group-focus-within:text-purple-400 transition-colors" />
          <input 
            type="text" 
            placeholder="搜索您的动画..." 
            className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-[10px] text-white/60 focus:outline-none focus:border-purple-500/30 transition-all font-medium"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 space-y-1.5 custom-scrollbar">
        <div className="px-3 py-2 text-[10px] font-black text-white/20 uppercase tracking-[0.3em] flex items-center gap-2">
          <Clock className="w-3 h-3" />
          历史会话
        </div>
        
        {sessions.map((session) => (
          <div
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            className={cn(
              "group relative flex items-center gap-3 px-3 py-3 rounded-2xl cursor-pointer transition-all border",
              activeSessionId === session.id 
                ? "bg-purple-600/10 border-purple-500/20 shadow-lg shadow-purple-500/5" 
                : "hover:bg-white/5 border-transparent"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all",
              activeSessionId === session.id ? "bg-purple-500/20 text-purple-400 scale-105" : "bg-white/5 text-white/20"
            )}>
              <MessageSquare className="w-4 h-4" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className={cn(
                "text-[11px] font-bold truncate leading-tight",
                activeSessionId === session.id ? "text-white" : "text-white/50 group-hover:text-white/80"
              )}>
                {session.title || '未命名动画'}
              </h4>
              <p className="text-[9px] text-white/20 mt-0.5 font-mono">
                {new Date(session.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteSession(session.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/10 rounded-xl text-white/10 hover:text-red-400 transition-all active:scale-90"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="p-5 border-t border-white/5 bg-[#0A0A0A]">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-[10px] font-black text-white shadow-xl shadow-purple-500/20">
            MA
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-black text-white truncate">Manim Studio AI</span>
            <span className="text-[8px] text-white/30 uppercase tracking-[0.1em] mt-0.5">Professional v1.2</span>
          </div>
        </div>
      </div>
    </div>
  );
}

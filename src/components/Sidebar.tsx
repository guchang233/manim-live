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
    <div className="h-full bg-[#0D0D0D] border-r border-white/5 flex flex-col min-w-0">
      <div className="p-4">
        <button
          onClick={onNewSession}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold transition-all group active:scale-95"
        >
          <Plus className="w-4 h-4 text-purple-400 group-hover:rotate-90 transition-transform" />
          新会话
        </button>
      </div>

      <div className="px-4 mb-2">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-3 h-3 text-white/20" />
          <input 
            type="text" 
            placeholder="搜索会话..." 
            className="w-full bg-white/5 border border-white/5 rounded-lg py-2 pl-8 pr-4 text-[10px] text-white/60 focus:outline-none focus:border-purple-500/30 transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        <div className="px-3 py-2 text-[10px] font-bold text-white/20 uppercase tracking-widest flex items-center gap-2">
          <Clock className="w-3 h-3" />
          最近记录
        </div>
        
        {sessions.map((session) => (
          <div
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            className={cn(
              "group relative flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all",
              activeSessionId === session.id 
                ? "bg-purple-600/10 border border-purple-500/20" 
                : "hover:bg-white/5 border border-transparent"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
              activeSessionId === session.id ? "bg-purple-500/20 text-purple-400" : "bg-white/5 text-white/20"
            )}>
              <MessageSquare className="w-4 h-4" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className={cn(
                "text-xs font-medium truncate",
                activeSessionId === session.id ? "text-purple-100" : "text-white/60"
              )}>
                {session.title || '未命名会话'}
              </h4>
              <p className="text-[10px] text-white/20 truncate">
                {new Date(session.updatedAt).toLocaleDateString()}
              </p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteSession(session.id);
              }}
              className="absolute right-2 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 rounded-md text-white/20 hover:text-red-400 transition-all"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-white/5 bg-black/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center text-[10px] font-bold">
            AI
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-white/80">Manim Pro</span>
            <span className="text-[9px] text-white/30 uppercase tracking-tighter">订阅版用户</span>
          </div>
        </div>
      </div>
    </div>
  );
}

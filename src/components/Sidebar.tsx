import React from 'react';
import { Plus, MessageSquare, Trash2, Clock, Search, ChevronDown, ChevronRight, FileText, Folder } from 'lucide-react';
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
    <div className="h-full bg-[var(--bg-side)] flex flex-col min-w-0 font-sans">
      <div className="flex-1 overflow-y-auto custom-scrollbar pt-1">
        <div className="group flex items-center px-1 py-1 hover:bg-[var(--bg-hover)] cursor-pointer text-[11px] font-bold text-[var(--text-main)] uppercase tracking-wider">
          <ChevronDown className="w-4 h-4 text-[var(--text-sub)]" />
          <span className="ml-0.5">ANIMATION_PROJECTS</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNewSession();
            }}
            className="ml-auto opacity-0 group-hover:opacity-100 p-1 hover:bg-[var(--border)] text-[var(--text-sub)] hover:text-[var(--text-main)] transition-all"
            title="New Session"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        
        <div className="mt-1">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={cn(
                "group relative flex items-center gap-1.5 px-4 py-1 cursor-pointer transition-colors text-[13px]",
                activeSessionId === session.id 
                  ? "bg-[var(--bg-hover)] text-[var(--text-main)]" 
                  : "text-[var(--text-sub)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)]"
              )}
            >
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <FileText className={cn(
                  "w-4 h-4 shrink-0",
                  activeSessionId === session.id ? "text-[#007acc]" : "text-[var(--text-sub)]"
                )} />
                <span className="truncate">{session.title || 'Untitled Session'}</span>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(session.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 text-[var(--text-sub)] hover:text-red-500 transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
              
              {activeSessionId === session.id && (
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[var(--accent)]" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 border-t border-[var(--border)] bg-[var(--bg-side)]">
        <div className="flex items-center gap-2 p-2 hover:bg-[var(--bg-hover)] rounded-sm cursor-pointer transition-colors">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-[var(--accent)] shadow-lg">
            AI
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-medium text-[var(--text-main)] truncate">Manim Assistant</span>
            <span className="text-[9px] text-[var(--text-sub)] leading-none">Studio Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}

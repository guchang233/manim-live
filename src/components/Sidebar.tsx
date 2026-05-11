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
    <div className="h-full bg-[#252526] flex flex-col min-w-0 font-sans">
      <div className="flex-1 overflow-y-auto custom-scrollbar pt-1">
        <div className="group flex items-center px-1 py-1 hover:bg-[#2a2d2e] cursor-pointer text-[11px] font-bold text-white uppercase tracking-wider">
          <ChevronDown className="w-4 h-4 text-[#858585]" />
          <span className="ml-0.5">ANIMATION_PROJECTS</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNewSession();
            }}
            className="ml-auto opacity-0 group-hover:opacity-100 p-1 hover:bg-[#37373d] text-[#858585] hover:text-white transition-opacity"
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
                  ? "bg-[#37373d] text-white" 
                  : "text-[#cccccc] hover:bg-[#2a2d2e]"
              )}
            >
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <FileText className={cn(
                  "w-4 h-4 shrink-0",
                  activeSessionId === session.id ? "text-blue-400" : "text-[#858585]"
                )} />
                <span className="truncate">{session.title || 'Untitled Session'}</span>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(session.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 text-[#858585] hover:text-red-400 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>
              
              {activeSessionId === session.id && (
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#007acc]" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 border-t border-[#1e1e1e] bg-[#252526]">
        <div className="flex items-center gap-2 p-2 hover:bg-[#2a2d2e] rounded-sm cursor-pointer transition-colors">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-blue-600 shadow-lg">
            GC
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-medium text-white truncate">Administrator</span>
            <span className="text-[9px] text-[#858585] leading-none">Ready for deployment</span>
          </div>
        </div>
      </div>
    </div>
  );
}

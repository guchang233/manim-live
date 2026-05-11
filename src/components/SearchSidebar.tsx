import React, { useState } from 'react';
import { Search, X, MoreHorizontal, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { Session } from '../types';

interface SearchSidebarProps {
  sessions: Session[];
  onSelectSession: (id: string) => void;
}

export default function SearchSidebar({ sessions, onSelectSession }: SearchSidebarProps) {
  const [query, setQuery] = useState('');

  const filteredSessions = sessions.filter(s => 
    (s.title?.toLowerCase().includes(query.toLowerCase())) ||
    (s.messages?.some(m => m.content?.toLowerCase().includes(query.toLowerCase())))
  );

  return (
    <div className="h-full flex flex-col bg-inherit font-sans">
      <div className="p-3 space-y-3">
        <div className="relative group">
          <input 
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索项目和消息..."
            className="w-full bg-[var(--bg-editor)] border border-[var(--border)] focus:border-[var(--accent)] text-[12px] px-3 py-1.5 focus:outline-none transition-colors text-[var(--text-main)]"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="absolute right-2 top-1.5 text-[var(--text-sub)] hover:text-[var(--text-main)] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        
        <div className="flex items-center justify-between text-[11px] text-[var(--text-sub)] uppercase font-bold tracking-wider px-1">
          <span>{query ? `找到 ${filteredSessions.length} 个结果` : '最近文件'}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredSessions.map(session => (
          <div 
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            className="px-4 py-2 hover:bg-[var(--bg-hover)] cursor-pointer group transition-colors flex flex-col gap-1 border-b border-[var(--border)]/10"
          >
            <div className="flex items-center justify-between min-w-0">
              <span className="text-[13px] text-[var(--text-main)] group-hover:text-[var(--accent)] truncate font-medium">
                {session.title || '未命名'}
              </span>
              <span className="text-[10px] text-[var(--text-sub)] shrink-0 ml-2">
                {new Date(session.updatedAt).toLocaleDateString()}
              </span>
            </div>
            {query && (
              <p className="text-[11px] text-[var(--text-sub)] line-clamp-1 italic opacity-70">
                {session?.messages?.find(m => m.content?.toLowerCase().includes(query.toLowerCase()))?.content?.slice(0, 50)}...
              </p>
            )}
          </div>
        ))}
        {query && filteredSessions.length === 0 && (
          <div className="p-8 text-center">
            <span className="text-[12px] text-[var(--text-sub)]">未找到与 "{query}" 匹配的内容</span>
          </div>
        )}
      </div>
    </div>
  );
}

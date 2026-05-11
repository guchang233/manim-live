import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, RotateCcw, Sparkles, Cpu, Palette, Globe, Key, Settings2 } from 'lucide-react';
import { UserSettings, DEFAULT_SETTINGS } from '../types';
import { cn } from '../lib/utils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (settings: UserSettings) => void;
}

export default function SettingsModal({ isOpen, onClose, settings, onSave }: SettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings);

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const handleReset = () => {
    setLocalSettings(DEFAULT_SETTINGS);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-sans">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative z-[110] w-full max-w-2xl bg-[var(--bg-side)] border border-[var(--border)] shadow-2xl rounded-lg overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--bg-side)]">
              <div className="flex items-center gap-3">
                <Settings2 className="w-5 h-5 text-[var(--accent)]" />
                <h2 className="text-[14px] font-medium text-[var(--text-main)]">设置</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-1 hover:bg-[var(--bg-hover)] rounded transition-colors text-[var(--text-sub)] hover:text-[var(--text-main)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden h-[500px]">
              {/* Sidebar Navigation */}
              <div className="w-48 bg-[var(--bg-side)] border-r border-[var(--border)] p-2 space-y-1">
                {['常规', '编辑器', 'AI 模型', '网络'].map((tab) => (
                  <button
                    key={tab}
                    className={cn(
                      "w-full text-left px-3 py-1.5 rounded text-[12px] transition-colors",
                      tab === '常规' ? "bg-[var(--bg-hover)] text-[var(--text-main)] font-medium" : "text-[var(--text-sub)] hover:bg-[var(--bg-hover)]"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Main Content Area */}
              <div className="flex-1 p-6 space-y-8 overflow-y-auto custom-scrollbar bg-[var(--bg-editor)]">
                {/* Visual Settings */}
                <section className="space-y-4">
                  <h3 className="text-[12px] font-bold text-[var(--text-sub)] uppercase tracking-wider">外观</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-[13px] text-[var(--text-main)]">应用主题</p>
                        <p className="text-[11px] text-[var(--text-sub)]">配置工作区的配色方案。</p>
                      </div>
                      <div className="flex bg-[var(--bg-side)] border border-[var(--border)] rounded p-0.5">
                        <button 
                          onClick={() => setLocalSettings({ ...localSettings, theme: 'vs-dark' })}
                          className={cn(
                            "px-3 py-1 rounded text-[11px] transition-all",
                            localSettings.theme === 'vs-dark' ? "bg-[var(--accent)] text-white" : "text-[var(--text-sub)] hover:text-[var(--text-main)]"
                          )}
                        >
                          深色
                        </button>
                        <button 
                          onClick={() => setLocalSettings({ ...localSettings, theme: 'light' })}
                          className={cn(
                            "px-3 py-1 rounded text-[11px] transition-all",
                            localSettings.theme === 'light' ? "bg-[var(--accent)] text-white" : "text-[var(--text-sub)] hover:text-[var(--text-main)]"
                          )}
                        >
                          浅色
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Model Configuration */}
                <section className="space-y-4 pt-4 border-t border-[var(--border)]">
                  <h3 className="text-[12px] font-bold text-[var(--text-sub)] uppercase tracking-wider">AI 引擎</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                       <p className="text-[13px] text-[var(--text-main)]">首选智能模型</p>
                       <div className="grid grid-cols-1 gap-2">
                         {['gemini-3.1-pro-preview', 'gemini-3-flash-preview', 'gemini-3.1-flash-lite'].map((m) => (
                           <button
                             key={m}
                             onClick={() => setLocalSettings({ ...localSettings, model: m })}
                             className={cn(
                               "flex items-center gap-3 w-full px-3 py-2 rounded border transition-all text-left",
                               localSettings.model === m 
                                 ? "bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--text-main)]" 
                                 : "border-[var(--border)] bg-[var(--bg-side)] text-[var(--text-sub)] hover:border-[var(--accent)]/50"
                             )}
                           >
                             <div className={cn(
                               "w-3 h-3 rounded-full border-2",
                               localSettings.model === m ? "bg-[var(--accent)] border-[var(--accent)]" : "border-[var(--border)]"
                             )} />
                             <span className="text-[12px] font-mono">{m}</span>
                           </button>
                         ))}
                       </div>
                    </div>
                  </div>
                </section>

                {/* Developer Options */}
                <section className="space-y-4 pt-4 border-t border-[var(--border)]">
                  <h3 className="text-[12px] font-bold text-[var(--text-sub)] uppercase tracking-wider">开发者上下文</h3>
                  <div className="space-y-2">
                    <p className="text-[13px] text-[var(--text-main)]">系统提示词注入</p>
                    <p className="text-[11px] text-[var(--text-sub)] mb-2">通过自定义指令覆盖 AI 的核心行为。</p>
                    <textarea
                      value={localSettings.customSystemPrompt}
                      onChange={(e) => setLocalSettings({ ...localSettings, customSystemPrompt: e.target.value })}
                      placeholder="在此添加系统指令..."
                      className="w-full h-32 bg-[var(--bg-side)] border border-[var(--border)] rounded p-3 text-[12px] text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none mb-4 shadow-inner"
                    />
                  </div>
                </section>
              </div>
            </div>

            <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-side)] flex items-center justify-between">
              <button
                onClick={handleReset}
                className="text-[12px] text-[var(--text-sub)] hover:text-[var(--text-main)] transition-colors"
              >
                重置为出厂预设
              </button>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-1.5 text-[12px] rounded text-[var(--text-sub)] hover:text-[var(--text-main)] transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-1.5 bg-[var(--accent)] hover:bg-[#118ad4] text-white text-[12px] font-medium rounded transition-colors shadow-lg"
                >
                  保存更改
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

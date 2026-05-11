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
            className="relative z-[110] w-full max-w-2xl bg-[#252526] border border-[#3c3c3c] shadow-2xl rounded-lg overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-[#3c3c3c] bg-[#252526]">
              <div className="flex items-center gap-3">
                <Settings2 className="w-5 h-5 text-blue-400" />
                <h2 className="text-[14px] font-medium text-white">Settings</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-1 hover:bg-[#37373d] rounded transition-colors text-[#858585] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden h-[500px]">
              {/* Sidebar Navigation */}
              <div className="w-48 bg-[#252526] border-r border-[#3c3c3c] p-2 space-y-1">
                {['General', 'Editor', 'AI Models', 'Network'].map((tab) => (
                  <button
                    key={tab}
                    className={cn(
                      "w-full text-left px-3 py-1.5 rounded text-[12px] transition-colors",
                      tab === 'General' ? "bg-[#37373d] text-white font-medium" : "text-[#cccccc] hover:bg-[#2a2d2e]"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Main Content Area */}
              <div className="flex-1 p-6 space-y-8 overflow-y-auto custom-scrollbar bg-[#1e1e1e]">
                {/* Visual Settings */}
                <section className="space-y-4">
                  <h3 className="text-[12px] font-bold text-[#858585] uppercase tracking-wider">Appearance</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-[13px] text-white">Application Theme</p>
                        <p className="text-[11px] text-[#858585]">Configure the color palette for the workspace.</p>
                      </div>
                      <div className="flex bg-[#252526] border border-[#3c3c3c] rounded p-0.5">
                        <button 
                          onClick={() => setLocalSettings({ ...localSettings, theme: 'vs-dark' })}
                          className={cn(
                            "px-3 py-1 rounded text-[11px] transition-all",
                            localSettings.theme === 'vs-dark' ? "bg-[#007acc] text-white" : "text-[#858585] hover:text-white"
                          )}
                        >
                          Dark
                        </button>
                        <button 
                          onClick={() => setLocalSettings({ ...localSettings, theme: 'light' })}
                          className={cn(
                            "px-3 py-1 rounded text-[11px] transition-all",
                            localSettings.theme === 'light' ? "bg-[#007acc] text-white" : "text-[#858585] hover:text-white"
                          )}
                        >
                          Light
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Model Configuration */}
                <section className="space-y-4 pt-4 border-t border-[#3c3c3c]">
                  <h3 className="text-[12px] font-bold text-[#858585] uppercase tracking-wider">AI Engines</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                       <p className="text-[13px] text-white">Preferred Intelligence Model</p>
                       <div className="grid grid-cols-1 gap-2">
                         {['gemini-3.1-pro-preview', 'gemini-3-flash-preview', 'gemini-3.1-flash-lite'].map((m) => (
                           <button
                             key={m}
                             onClick={() => setLocalSettings({ ...localSettings, model: m })}
                             className={cn(
                               "flex items-center gap-3 w-full px-3 py-2 rounded border transition-all text-left",
                               localSettings.model === m 
                                 ? "bg-[#007acc]/10 border-[#007acc] text-white" 
                                 : "border-[#3c3c3c] bg-[#252526] text-[#858585] hover:border-[#454545]"
                             )}
                           >
                             <div className={cn(
                               "w-3 h-3 rounded-full border-2",
                               localSettings.model === m ? "bg-white border-white" : "border-[#454545]"
                             )} />
                             <span className="text-[12px] font-mono">{m}</span>
                           </button>
                         ))}
                       </div>
                    </div>
                  </div>
                </section>

                {/* Developer Options */}
                <section className="space-y-4 pt-4 border-t border-[#3c3c3c]">
                  <h3 className="text-[12px] font-bold text-[#858585] uppercase tracking-wider">Developer Context</h3>
                  <div className="space-y-2">
                    <p className="text-[13px] text-white">System Prompt Injection</p>
                    <p className="text-[11px] text-[#858585] mb-2">Override the AI's core behavior with custom instructions.</p>
                    <textarea
                      value={localSettings.customSystemPrompt}
                      onChange={(e) => setLocalSettings({ ...localSettings, customSystemPrompt: e.target.value })}
                      placeholder="Add system instructions here..."
                      className="w-full h-32 bg-[#252526] border border-[#3c3c3c] rounded p-3 text-[12px] text-[#cccccc] focus:outline-none focus:border-[#007acc] transition-colors resize-none"
                    />
                  </div>
                </section>
              </div>
            </div>

            <div className="p-4 border-t border-[#3c3c3c] bg-[#252526] flex items-center justify-between">
              <button
                onClick={handleReset}
                className="text-[12px] text-[#858585] hover:text-white transition-colors"
              >
                Reset to factory defaults
              </button>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-1.5 text-[12px] rounded text-white hover:bg-[#37373d] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-1.5 bg-[#007acc] hover:bg-[#118ad4] text-white text-[12px] font-medium rounded transition-colors shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, RotateCcw, Sparkles, Cpu, Palette } from 'lucide-react';
import { UserSettings, DEFAULT_SETTINGS } from '../types';

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
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 px-4 flex items-center justify-center"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed z-[60] w-full max-w-lg bg-[#0D0D0D] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">用户设置</h2>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest leading-none mt-1">个性化您的 Manim 创造记录</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/40 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Model Selection */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  <Cpu className="w-3 h-3" />
                  模型选择
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash-exp'].map((m) => (
                    <button
                      key={m}
                      onClick={() => setLocalSettings({ ...localSettings, model: m })}
                      className={`px-4 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                        localSettings.model === m 
                          ? 'bg-purple-600/10 border-purple-500/30 text-purple-400' 
                          : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Selection */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  <Palette className="w-3 h-3" />
                  编辑器主题
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setLocalSettings({ ...localSettings, theme: 'vs-dark' })}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                      localSettings.theme === 'vs-dark' 
                        ? 'bg-purple-600/10 border-purple-500/30 text-purple-400' 
                        : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                    }`}
                  >
                    Dark (推荐)
                  </button>
                  <button
                    onClick={() => setLocalSettings({ ...localSettings, theme: 'light' })}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                      localSettings.theme === 'light' 
                        ? 'bg-purple-600/10 border-purple-500/30 text-purple-400' 
                        : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                    }`}
                  >
                    Light
                  </button>
                </div>
              </div>

              {/* Custom Prompt */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                    <Sparkles className="w-3 h-3" />
                    自定义系统提示词
                  </label>
                </div>
                <textarea
                  value={localSettings.customSystemPrompt}
                  onChange={(e) => setLocalSettings({ ...localSettings, customSystemPrompt: e.target.value })}
                  placeholder="例如：请确保生成的动画色彩鲜明，且公式总是显示在屏幕中央..."
                  className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-white/80 focus:outline-none focus:border-purple-500/30 transition-colors resize-none"
                />
                <p className="text-[10px] text-white/20 italic">
                  * 此提示词将附加到基础指令之后，用于微调 AI 的生成倾向。
                </p>
              </div>
            </div>

            <div className="p-6 bg-black/20 border-t border-white/5 flex items-center justify-between gap-4">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white/40 hover:text-white transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                重置默认
              </button>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white/40 hover:bg-white/5 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl text-xs font-bold text-white transition-all shadow-lg active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  保存设置
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

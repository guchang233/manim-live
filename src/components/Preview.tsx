import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as LucideIcons from 'lucide-react';
import { transform } from 'sucrase';
import { cn } from '../lib/utils';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface PreviewProps {
  code: string;
  className?: string;
  progress?: number;
}

export default function Preview({ code, className, progress = 0 }: PreviewProps) {
  const [error, setError] = useState<string | null>(null);
  const [Comp, setComp] = useState<React.ComponentType<{ progress: number }> | null>(null);

  useEffect(() => {
    if (!code) return;

    try {
      setError(null);
      
      const cleanedCode = code.trim();

      const result = transform(cleanedCode, {
        transforms: ['jsx', 'typescript'],
        production: true,
      });

      const createComponent = new Function('React', 'motion', 'AnimatePresence', 'Lucide', 'cn', `
        const { useState, useEffect, useMemo, useRef, useCallback } = React;
        const Component = ${result.code};
        return Component;
      `);

      const Component = createComponent(React, motion, AnimatePresence, LucideIcons, cn);
      
      setComp(() => Component);
    } catch (err: any) {
      console.error('Preview Error:', err);
      setError(err.message || 'Error compiling preview');
    }
  }, [code]);

  return (
    <div className={cn("relative w-full h-full bg-[#111] overflow-hidden rounded-lg flex items-center justify-center border border-white/10", className)}>
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-red-950/20">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-red-400 font-semibold mb-2">预览编译错误</h3>
          <p className="text-red-300/70 text-sm font-mono break-all">{error}</p>
        </div>
      ) : Comp ? (
        <div key={code} className="w-full h-full flex items-center justify-center">
          <Comp progress={progress} />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 text-white/30">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <p className="text-sm">正在初始化预览...</p>
        </div>
      )}
    </div>
  );
}

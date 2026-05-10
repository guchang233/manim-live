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
      
      if (!code || code.length < 10) return;

      const result = transform(code, {
        transforms: ['jsx', 'typescript', 'imports'],
        production: false,
      });

      // Construct a safe execution body with mock require and exports
      const body = [
        'const exports = {};',
        'const module = { exports };',
        'const require = (path) => {',
        '  const p = path.toLowerCase();',
        '  if (p === "react") return React;',
        '  if (p === "motion/react" || p === "framer-motion") return { motion, AnimatePresence };',
        '  if (p === "lucide-react") return Lucide;',
        '  if (p.includes("utils")) return { cn };',
        '  return {};',
        '};',
        'const { useState, useEffect, useMemo, useRef, useCallback } = React;',
        'try {',
        result.code,
        '  const allExports = { ...exports, ...module.exports };',
        '  const func = allExports.default || Object.values(allExports).find(v => typeof v === "function");',
        '  return func || null;',
        '} catch (e) {',
        '  throw e;',
        '}'
      ].join('\n');

      const createComponent = new Function('React', 'motion', 'AnimatePresence', 'Lucide', 'cn', body);
      const Component = createComponent(React, motion, AnimatePresence, LucideIcons, cn);
      
      if (!Component) {
        throw new Error('No valid component found in React code.');
      }

      setComp(() => Component);
    } catch (err: any) {
      console.warn('Real-time compile error:', err);
      // We don't set global error for partial typing to avoid flickering, 
      // but if the code is substantial and fails, we show it.
      if (code.length > 100) {
        setError(err.message);
      }
    }
  }, [code]);

  return (
    <div className={cn("relative w-full h-full bg-[#050505] overflow-hidden rounded-2xl flex items-center justify-center border border-white/5 min-w-0 min-h-0", className)}>
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-red-950/20 backdrop-blur-sm">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/20">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-red-400 font-bold mb-2 uppercase tracking-widest text-xs">Preview Render Failed</h3>
          <p className="text-red-300/50 text-[10px] font-mono leading-relaxed max-w-sm">{error}</p>
        </div>
      ) : Comp ? (
        <div key={code} className="w-full h-full flex items-center justify-center bg-black">
          <Comp progress={progress} />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 text-white/10 uppercase tracking-[0.4em] font-black">
          <div className="relative">
            <RefreshCw className="w-12 h-12 animate-spin-slow" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
            </div>
          </div>
          <p className="text-[10px]">Awaiting Core</p>
        </div>
      )}
    </div>
  );
}

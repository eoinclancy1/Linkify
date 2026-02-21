'use client';

import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  text: string;
}

export default function InfoTooltip({ text }: InfoTooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const iconRef = useRef<HTMLSpanElement>(null);

  const show = useCallback(() => {
    if (!iconRef.current) return;
    const rect = iconRef.current.getBoundingClientRect();
    setCoords({
      top: rect.top - 8,
      left: rect.left + rect.width / 2,
    });
    setVisible(true);
  }, []);

  const hide = useCallback(() => setVisible(false), []);

  return (
    <>
      <span
        ref={iconRef}
        className="inline-flex cursor-help"
        onMouseEnter={show}
        onMouseLeave={hide}
      >
        <Info className="w-3.5 h-3.5 text-neutral-500 hover:text-neutral-300 transition-colors" />
      </span>
      {visible && typeof document !== 'undefined' && createPortal(
        <span
          className="fixed z-[9999] pointer-events-none w-52 rounded-lg bg-elevated border border-highlight px-3 py-2 text-xs text-neutral-300 leading-relaxed shadow-lg"
          style={{
            top: coords.top,
            left: coords.left,
            transform: 'translate(-50%, -100%)',
          }}
        >
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-elevated" />
        </span>,
        document.body,
      )}
    </>
  );
}

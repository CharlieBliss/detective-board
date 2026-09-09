import React from 'react';
import type { HoverInfo } from '../types/board';


interface FloatingTooltipProps {
  info: HoverInfo | null;
}

export const FloatingTooltip: React.FC<FloatingTooltipProps> = ({ info }) => {
  if (!info || !info.description) return null;

  // Position tooltip safely offset from the cursor
  const left = Math.min(window.innerWidth - 300, Math.max(20, info.x + 15));
  const top = Math.min(window.innerHeight - 150, Math.max(20, info.y + 15));

  return (
    <div
      className="fixed z-50 pointer-events-none transition-opacity duration-150 animate-fadeIn"
      style={{ left: `${left}px`, top: `${top}px`, maxWidth: '280px' }}
    >
      <div className="bg-stone-900/95 text-stone-100 border border-stone-600 rounded-md p-3 shadow-2xl backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-stone-700">
          <span className="text-xs font-bold font-mono text-amber-400 uppercase tracking-wide truncate">
            {info.title}
          </span>
          {info.type && (
            <span className="text-[9px] font-mono uppercase bg-stone-800 text-stone-300 px-1.5 py-0.5 rounded border border-stone-700">
              {info.type}
            </span>
          )}
        </div>

        <p className="text-xs text-stone-300 leading-relaxed font-sans line-clamp-4">
          {info.description}
        </p>

        {info.last_edited_by && (
          <div className="mt-2 pt-1 border-t border-stone-800 text-[9px] text-stone-400 font-mono flex items-center justify-between">
            <span>Investigator:</span>
            <span className="text-stone-300">{info.last_edited_by}</span>
          </div>
        )}
      </div>
    </div>
  );
};

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { ThreadHubData } from '../types/board';
import { Tag } from 'lucide-react';


export const ThreadHubNode = memo(({ data }: NodeProps) => {
  const thread = data as unknown as ThreadHubData;
  const { title, connected_nodes, isDimmed, isSelected, isConnectedToSelected, last_edited_by } = thread;

  return (
    <div
      className={`relative group transition-all duration-300 select-none cursor-pointer ${
        isDimmed ? 'opacity-25 grayscale-[70%] scale-90' : 'opacity-100 scale-100'
      } ${
        isSelected
          ? 'ring-4 ring-red-500 shadow-[0_0_30px_rgba(239,68,68,0.8)] z-30 scale-110'
          : isConnectedToSelected
          ? 'ring-2 ring-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.6)] z-20'
          : 'shadow-lg hover:scale-105 hover:shadow-xl'
      }`}
    >
      {/* Central Handle where all red string edges terminate */}
      <Handle
        type="target"
        position={Position.Top}
        id="hub-target"
        style={{
          top: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '10px',
          height: '10px',
          background: '#ef4444',
          border: 'none',
          opacity: 0,
        }}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="hub-source"
        style={{
          top: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '10px',
          height: '10px',
          background: '#ef4444',
          border: 'none',
          opacity: 0,
        }}
      />

      {/* Center Brass/Ruby Pin with knot */}
      <div className="flex flex-col items-center">
        <div className="relative z-20">
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-red-700 via-red-500 to-amber-300 shadow-md border-2 border-stone-900 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-stone-900" />
          </div>
          {/* Subtle red yarn knot indicator */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-red-600 rounded-full blur-[0.5px]" />
        </div>

        {/* Vintage Thread Label Card */}
        <div
          className="mt-1 px-3 py-1.5 rounded bg-stone-900 text-stone-100 border border-red-900/80 shadow-md max-w-[200px] text-center"
          style={{
            backgroundImage: 'linear-gradient(to bottom, #1c1917, #0c0a09)',
          }}
        >
          <div className="flex items-center justify-center gap-1.5 mb-0.5">
            <Tag className="w-3 h-3 text-red-400" />
            <span className="text-[9px] font-mono tracking-widest text-red-400 uppercase font-semibold">
              THREAD ({connected_nodes.length})
            </span>
          </div>

          <p className="text-xs font-bold font-mono leading-tight text-stone-200 line-clamp-2">
            {title}
          </p>

          {last_edited_by && (
            <p className="text-[8px] font-mono text-stone-400 mt-1 border-t border-stone-800 pt-0.5 truncate">
              By: {last_edited_by}
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

ThreadHubNode.displayName = 'ThreadHubNode';

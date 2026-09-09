import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { EntityNodeData } from '../types/board';

import { User, MapPin, Lightbulb } from 'lucide-react';

const typeIcons = {
  person: <User className="w-3.5 h-3.5 text-amber-500" />,
  place: <MapPin className="w-3.5 h-3.5 text-emerald-500" />,
  concept: <Lightbulb className="w-3.5 h-3.5 text-blue-500" />,
};

const typeLabels = {
  person: 'PERSON OF INTEREST',
  place: 'LOCATION',
  concept: 'EVIDENCE / LEAD',
};

export const EntityNode = memo(({ data }: NodeProps) => {
  const entity = data as unknown as EntityNodeData;
  const { title, type, image_url, isDimmed, isSelected, isConnectedToSelected, last_edited_by } = entity;

  return (
    <div
      className={`relative group transition-all duration-300 select-none cursor-pointer ${
        isDimmed ? 'opacity-25 grayscale-[60%] scale-95' : 'opacity-100 scale-100'
      } ${
        isSelected
          ? 'ring-4 ring-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.6)] z-30'
          : isConnectedToSelected
          ? 'ring-2 ring-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)] z-20'
          : 'shadow-xl hover:shadow-2xl hover:scale-105'
      }`}
      style={{ width: '180px' }}
    >
      {/* Central Handle hidden behind the pushpin so red strings connect to the pin */}
      <Handle
        type="source"
        position={Position.Top}
        id="pin-handle"
        style={{
          top: '6px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '12px',
          height: '12px',
          background: '#dc2626',
          border: '2px solid #fff',
          zIndex: 10,
          opacity: 0,
        }}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="pin-target"
        style={{
          top: '6px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '12px',
          height: '12px',
          background: '#dc2626',
          border: '2px solid #fff',
          zIndex: 10,
          opacity: 0,
        }}
      />

      {/* Realistic Pushpin Graphic */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-red-500 via-red-600 to-red-800 shadow-md border border-red-900 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-red-200 opacity-80" />
        </div>
        <div className="w-1 h-2 bg-stone-400 mx-auto -mt-0.5" />
      </div>

      {/* Polaroid / Evidence Card Container */}
      <div
        className={`pt-3 pb-2 px-2.5 rounded-sm border ${
          type === 'concept'
            ? 'bg-amber-50 border-amber-300 text-stone-900 shadow-[2px_4px_12px_rgba(0,0,0,0.3)]'
            : 'bg-stone-100 border-stone-300 text-stone-900 shadow-[2px_6px_16px_rgba(0,0,0,0.35)]'
        }`}
        style={{
          backgroundImage:
            type === 'concept'
              ? 'repeating-linear-gradient(#fef3c7, #fef3c7 20px, #fde68a 21px)'
              : 'radial-gradient(#f5f5f4 85%, #e7e5e4 100%)',
        }}
      >
        {/* Type Header Tag */}
        <div className="flex items-center justify-between gap-1 mb-1.5 pb-1 border-b border-stone-300/80">
          <div className="flex items-center gap-1">
            {typeIcons[type]}
            <span className="text-[9px] font-bold tracking-wider uppercase text-stone-600 font-mono">
              {typeLabels[type]}
            </span>
          </div>
        </div>

        {/* Photo / Visual Area */}
        <div className="w-full h-24 bg-stone-800 rounded-sm overflow-hidden mb-2 relative border border-stone-400/60 shadow-inner flex items-center justify-center">
          {image_url ? (
            <img
              src={image_url}
              alt={title}
              className="w-full h-full object-cover grayscale-[30%] contrast-110 group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                // Fallback on broken image
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-stone-900/90 text-stone-500">
              {typeIcons[type]}
              <span className="text-[10px] font-mono mt-1 text-stone-400">NO PHOTO</span>
            </div>
          )}
        </div>

        {/* Title / Description Note */}
        <div className="text-center font-mono">
          <h4 className="text-xs font-bold leading-tight text-stone-900 line-clamp-2 uppercase tracking-wide">
            {title}
          </h4>
        </div>

        {/* Honor System Stamp */}
        {last_edited_by && (
          <div className="mt-1.5 pt-1 border-t border-dashed border-stone-300 text-[8px] text-stone-500 font-mono flex items-center justify-between">
            <span className="truncate">By: {last_edited_by}</span>
          </div>
        )}
      </div>
    </div>
  );
});

EntityNode.displayName = 'EntityNode';

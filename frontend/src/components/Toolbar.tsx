import React from 'react';
import type { BoardState } from '../types/board';

import { 
  FolderSearch, 
  Plus, 
  GitBranch, 
  Upload, 
  Sparkles, 
  Shield, 
  RefreshCw,
  UserCheck
} from 'lucide-react';

interface ToolbarProps {
  boardState: BoardState;
  onAddNode: () => void;
  onAddThread: () => void;
  onBulkImport: () => void;
  onRefresh: () => void;
  onLoadSample: () => void;
  onEditIdentity: () => void;
  currentUsername: string | null;
  loading: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  boardState,
  onAddNode,
  onAddThread,
  onBulkImport,
  onRefresh,
  onLoadSample,
  onEditIdentity,
  currentUsername,
  loading,
}) => {
  const peopleCount = boardState.nodes.filter((n) => n.type === 'person').length;
  const placeCount = boardState.nodes.filter((n) => n.type === 'place').length;
  const conceptCount = boardState.nodes.filter((n) => n.type === 'concept').length;

  return (
    <header className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
      {/* Title / Case File Badge */}
      <div className="flex items-center gap-3 bg-stone-900/95 border border-stone-700/80 rounded-lg px-4 py-2 shadow-2xl backdrop-blur-md pointer-events-auto">
        <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <FolderSearch className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold font-mono tracking-wider text-amber-400 uppercase">
              CASE FILE: THE CRAZY WALL
            </h1>
            <span className="text-[9px] font-mono uppercase bg-red-950/80 border border-red-800 text-red-300 px-1.5 py-0.2 rounded">
              CONFIDENTIAL
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-mono text-stone-400 mt-0.5">
            <span>{boardState.nodes.length} Evidence Items ({peopleCount}P / {placeCount}L / {conceptCount}C)</span>
            <span>•</span>
            <span className="text-red-400 font-semibold">{boardState.threads.length} Red Threads</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {boardState.nodes.length === 0 && (
          <button
            onClick={onLoadSample}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-600/90 hover:bg-amber-500 text-stone-950 font-bold font-mono text-xs uppercase tracking-wider shadow-xl transition-all border border-amber-400/40 hover:scale-105"
            title="Populate board with rich noir crime mystery sample"
          >
            <Sparkles className="w-4 h-4" />
            <span>Load Sample Case</span>
          </button>
        )}

        <button
          onClick={onAddNode}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-900/95 hover:bg-stone-850 text-stone-100 border border-stone-700 text-xs font-mono tracking-wide shadow-xl backdrop-blur-md transition-all hover:border-amber-500"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Add Evidence</span>
        </button>

        <button
          onClick={onAddThread}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-900/95 hover:bg-stone-850 text-stone-100 border border-stone-700 text-xs font-mono tracking-wide shadow-xl backdrop-blur-md transition-all hover:border-red-500"
        >
          <GitBranch className="w-4 h-4 text-red-400" />
          <span>Connect (Thread)</span>
        </button>

        <button
          onClick={onBulkImport}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-900/95 hover:bg-stone-850 text-stone-100 border border-stone-700 text-xs font-mono tracking-wide shadow-xl backdrop-blur-md transition-all hover:border-amber-400"
        >
          <Upload className="w-4 h-4 text-stone-300" />
          <span>Import JSON</span>
        </button>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-2 rounded-lg bg-stone-900/95 hover:bg-stone-850 text-stone-300 hover:text-stone-100 border border-stone-700 shadow-xl backdrop-blur-md transition-all"
          title="Refresh board state from database"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
        </button>

        {/* Detective Identity Badge */}
        <button
          onClick={onEditIdentity}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-950/90 hover:bg-stone-900 border border-amber-900/60 text-amber-400 text-xs font-mono tracking-wide shadow-xl backdrop-blur-md transition-all"
          title="Click to set investigator name"
        >
          {currentUsername ? (
            <>
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <span className="max-w-[120px] truncate">{currentUsername}</span>
            </>
          ) : (
            <>
              <Shield className="w-3.5 h-3.5 text-stone-400" />
              <span className="text-stone-400">Set Detective ID</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};

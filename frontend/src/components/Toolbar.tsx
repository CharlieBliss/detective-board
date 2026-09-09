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
  UserCheck,
  Edit2,
  FolderPlus
} from 'lucide-react';

interface ToolbarProps {
  boardState: BoardState;
  onAddNode: () => void;
  onAddThread: () => void;
  onBulkImport: () => void;
  onRefresh: () => void;
  onLoadSample: () => void;
  onEditIdentity: () => void;
  onEditBoardName: () => void;
  onNewBoard: () => void;
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
  onEditBoardName,
  onNewBoard,
  currentUsername,
  loading,
}) => {
  const peopleCount = boardState.nodes.filter((n) => n.type === 'person').length;
  const placeCount = boardState.nodes.filter((n) => n.type === 'place').length;
  const conceptCount = boardState.nodes.filter((n) => n.type === 'concept').length;
  const boardTitle = boardState.title || 'CASE FILE: THE CRAZY WALL';

  return (
    <header className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-none gap-4">
      {/* Title / Case File Badge */}
      <div className="flex items-center gap-3 bg-stone-900/95 border border-stone-700/80 rounded-lg px-4 py-2 shadow-2xl backdrop-blur-md pointer-events-auto max-w-lg">
        <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
          <FolderSearch className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <button
              onClick={onEditBoardName}
              className="text-sm font-bold font-mono tracking-wider text-amber-400 uppercase truncate hover:text-amber-300 text-left transition-colors flex items-center gap-1.5 group"
              title="Click to rename this case board"
            >
              <span className="truncate">{boardTitle}</span>
              <Edit2 className="w-3 h-3 text-stone-500 group-hover:text-amber-400 flex-shrink-0" />
            </button>
            <span className="text-[9px] font-mono uppercase bg-red-950/80 border border-red-800 text-red-300 px-1.5 py-0.2 rounded flex-shrink-0">
              CONFIDENTIAL
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-mono text-stone-400 mt-0.5 truncate">
            <span>{boardState.nodes.length} Evidence ({peopleCount}P / {placeCount}L / {conceptCount}C)</span>
            <span>•</span>
            <span className="text-red-400 font-semibold">{boardState.threads.length} Red Threads</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pointer-events-auto flex-wrap justify-end">
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
          onClick={onNewBoard}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-900/95 hover:bg-stone-850 text-stone-100 border border-stone-700 text-xs font-mono tracking-wide shadow-xl backdrop-blur-md transition-all hover:border-emerald-500"
          title="Create a new empty case board"
        >
          <FolderPlus className="w-4 h-4 text-emerald-400" />
          <span>New Board</span>
        </button>

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

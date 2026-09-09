import React from 'react';
import type { SelectedEntity, BoardState, BoardNode, BoardThread } from '../types/board';
import { X, Edit3, Trash2, Link, User, MapPin, Lightbulb, ExternalLink, ShieldCheck } from 'lucide-react';


interface DetailPanelProps {
  selected: SelectedEntity;
  boardState: BoardState;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSelectNode: (node: BoardNode) => void;
  onSelectThread: (thread: BoardThread) => void;
}

const typeIcons = {
  person: <User className="w-4 h-4 text-amber-500" />,
  place: <MapPin className="w-4 h-4 text-emerald-500" />,
  concept: <Lightbulb className="w-4 h-4 text-blue-500" />,
};

export const DetailPanel: React.FC<DetailPanelProps> = ({
  selected,
  boardState,
  onClose,
  onEdit,
  onDelete,
  onSelectNode,
  onSelectThread,
}) => {
  if (!selected) return null;

  const isNode = selected.type === 'node';
  const node = isNode ? (selected.data as BoardNode) : null;
  const thread = !isNode ? (selected.data as BoardThread) : null;

  // Compute connections
  const connectedThreads: BoardThread[] = isNode && node
    ? boardState.threads.filter((t) => t.connected_nodes.includes(node.id))
    : [];

  const connectedNodes: BoardNode[] = !isNode && thread
    ? boardState.nodes.filter((n) => thread.connected_nodes.includes(n.id))
    : [];

  return (
    <div className="fixed top-0 right-0 h-full w-96 bg-stone-900/95 border-l border-stone-700 shadow-2xl backdrop-blur-md z-40 flex flex-col text-stone-200 transition-transform duration-300 ease-in-out">
      {/* Header Bar */}
      <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/80">
        <div className="flex items-center gap-2">
          {isNode && node && typeIcons[node.type]}
          {!isNode && <Link className="w-4 h-4 text-red-500" />}
          <span className="text-xs font-mono font-bold tracking-wider text-amber-400 uppercase">
            {isNode ? `DOSSIER: ${node?.type}` : 'CASE THREAD / HYPEREDGE'}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          title="Close panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Title */}
        <div>
          <h2 className="text-xl font-bold font-mono text-stone-100 uppercase tracking-wide">
            {isNode ? node?.title : thread?.title}
          </h2>
          <div className="mt-1 flex items-center gap-2 text-xs font-mono text-stone-400">
            <ShieldCheck className="w-3.5 h-3.5 text-stone-500" />
            <span>ID: {(isNode ? node?.id : thread?.id)?.slice(0, 8)}...</span>
          </div>
        </div>

        {/* Image Preview (if Node with image) */}
        {isNode && node?.image_url && (
          <div className="w-full h-48 rounded-md overflow-hidden border border-stone-700 bg-stone-950 shadow-inner">
            <img
              src={node.image_url}
              alt={node.title}
              className="w-full h-full object-cover grayscale-[20%]"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Description / Evidence Notes */}
        <div>
          <h3 className="text-xs font-mono uppercase tracking-wider text-stone-400 mb-2 border-b border-stone-800 pb-1">
            Case Notes & Evidence
          </h3>
          <p className="text-sm text-stone-300 leading-relaxed font-serif whitespace-pre-wrap bg-stone-950/50 p-3 rounded border border-stone-800">
            {(isNode ? node?.description : thread?.description) || 'No notes on record.'}
          </p>
        </div>

        {/* Honor System Info */}
        <div className="bg-stone-950/40 p-3 rounded border border-stone-800/80 text-xs font-mono space-y-1">
          <div className="flex items-center justify-between text-stone-400">
            <span>Last Modified By:</span>
            <span className="text-amber-400 font-semibold">
              {(isNode ? node?.last_edited_by : thread?.last_edited_by) || 'Unknown Detective'}
            </span>
          </div>
        </div>

        {/* Connections Section */}
        {isNode && (
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-stone-400 mb-2 border-b border-stone-800 pb-1 flex items-center justify-between">
              <span>Linked Threads ({connectedThreads.length})</span>
            </h3>
            {connectedThreads.length === 0 ? (
              <p className="text-xs text-stone-500 italic">No threads connected to this node yet.</p>
            ) : (
              <div className="space-y-2">
                {connectedThreads.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onSelectThread(t)}
                    className="w-full text-left p-2.5 rounded bg-stone-800/60 hover:bg-stone-800 border border-stone-700/60 hover:border-red-500/60 transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-mono font-semibold text-stone-200 group-hover:text-red-400">
                        {t.title}
                      </div>
                      <div className="text-[10px] text-stone-400 truncate max-w-[240px]">
                        {t.connected_nodes.length} connected pieces of evidence
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-stone-500 group-hover:text-red-400" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!isNode && (
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-stone-400 mb-2 border-b border-stone-800 pb-1 flex items-center justify-between">
              <span>Connected Evidence ({connectedNodes.length})</span>
            </h3>
            {connectedNodes.length === 0 ? (
              <p className="text-xs text-stone-500 italic">No evidence linked to this thread.</p>
            ) : (
              <div className="space-y-2">
                {connectedNodes.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => onSelectNode(n)}
                    className="w-full text-left p-2.5 rounded bg-stone-800/60 hover:bg-stone-800 border border-stone-700/60 hover:border-amber-400/60 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5">
                      {typeIcons[n.type]}
                      <div>
                        <div className="text-xs font-mono font-semibold text-stone-200 group-hover:text-amber-400">
                          {n.title}
                        </div>
                        <div className="text-[10px] text-stone-500 uppercase font-mono">
                          {n.type}
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-stone-500 group-hover:text-amber-400" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Action Buttons */}
      <div className="p-4 border-t border-stone-800 bg-stone-950 flex items-center gap-3">
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold font-mono text-xs uppercase tracking-wide transition-colors"
        >
          <Edit3 className="w-4 h-4" />
          <span>Edit</span>
        </button>
        <button
          onClick={onDelete}
          className="flex items-center justify-center gap-2 py-2 px-3 rounded bg-red-950/80 hover:bg-red-900 text-red-300 hover:text-red-100 border border-red-800 font-mono text-xs transition-colors"
          title="Delete this record"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

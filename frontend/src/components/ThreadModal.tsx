import React, { useState, useEffect } from 'react';
import type { BoardNode, BoardThread } from '../types/board';

import { api } from '../api/client';
import { X, Check, GitBranch, User, MapPin, Lightbulb } from 'lucide-react';

interface ThreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onRequestIdentity: (action: () => void) => void;
  threadToEdit?: BoardThread | null;
  availableNodes: BoardNode[];
}

const typeIcons = {
  person: <User className="w-3.5 h-3.5 text-amber-500" />,
  place: <MapPin className="w-3.5 h-3.5 text-emerald-500" />,
  concept: <Lightbulb className="w-3.5 h-3.5 text-blue-500" />,
};

export const ThreadModal: React.FC<ThreadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onRequestIdentity,
  threadToEdit,
  availableNodes,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (threadToEdit) {
      setTitle(threadToEdit.title);
      setDescription(threadToEdit.description || '');
      setSelectedNodes(threadToEdit.connected_nodes || []);
    } else {
      setTitle('');
      setDescription('');
      setSelectedNodes([]);
    }
    setError(null);
  }, [threadToEdit, isOpen]);

  if (!isOpen) return null;

  const toggleNode = (nodeId: string) => {
    setSelectedNodes((prev) =>
      prev.includes(nodeId) ? prev.filter((id) => id !== nodeId) : [...prev, nodeId]
    );
  };

  const executeSave = async () => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        connected_nodes: selectedNodes,
      };

      if (threadToEdit) {
        await api.updateThread(threadToEdit.id, payload);
      } else {
        await api.createThread(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail || 'Failed to save thread.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onRequestIdentity(executeSave);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-stone-900 border border-stone-700 rounded-lg shadow-2xl overflow-hidden animate-fadeIn flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-stone-950 p-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-red-500" />
            <h3 className="font-mono text-sm font-bold tracking-wider text-amber-400 uppercase">
              {threadToEdit ? 'EDIT THREAD CONNECTION' : 'CONNECT EVIDENCE (NEW THREAD)'}
            </h3>
          </div>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 rounded text-xs font-mono">
              {error}
            </div>
          )}

          <div>
            <label className="block font-mono text-xs text-stone-300 uppercase tracking-wide mb-1.5">
              Thread Title / Connection Hypothesis *
            </label>
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Heist Planning Meeting, Motive Over Syndicate Ledger"
              className="w-full bg-stone-950 border border-stone-700 rounded px-3 py-2 text-stone-100 font-mono text-sm focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div>
            <label className="block font-mono text-xs text-stone-300 uppercase tracking-wide mb-1.5">
              Description / Connection Theory
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why are these items connected? What link was uncovered?"
              className="w-full bg-stone-950 border border-stone-700 rounded p-3 text-stone-100 font-sans text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block font-mono text-xs text-stone-300 uppercase tracking-wide">
                Connect Evidence Nodes ({selectedNodes.length} Selected)
              </label>
              <span className="text-[10px] font-mono text-amber-400">
                Supports hyperedges (3+ nodes)
              </span>
            </div>

            {availableNodes.length === 0 ? (
              <p className="text-xs text-stone-500 italic p-3 bg-stone-950 rounded border border-stone-800">
                No evidence nodes available on the board yet. Add nodes first.
              </p>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-stone-950 rounded border border-stone-800">
                {availableNodes.map((n) => {
                  const isChecked = selectedNodes.includes(n.id);
                  return (
                    <label
                      key={n.id}
                      className={`flex items-center gap-2.5 p-2 rounded cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-red-950/50 border border-red-800/80 text-stone-100'
                          : 'hover:bg-stone-900 border border-transparent text-stone-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleNode(n.id)}
                        className="rounded border-stone-700 bg-stone-900 text-red-600 focus:ring-red-500"
                      />
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        {typeIcons[n.type]}
                        <span className="text-xs font-mono truncate">{n.title}</span>
                      </div>
                      <span className="text-[9px] uppercase font-mono text-stone-500">
                        {n.type}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded text-xs font-mono text-stone-400 hover:text-stone-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex items-center gap-1.5 px-5 py-2 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-stone-950 font-bold font-mono text-xs uppercase tracking-wider transition-colors shadow-lg"
            >
              <Check className="w-4 h-4" />
              <span>{threadToEdit ? 'Save Changes' : 'String Red Yarn'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

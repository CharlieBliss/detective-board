import React, { useState } from 'react';
import { X, Check, FolderPlus, AlertTriangle } from 'lucide-react';
import { api } from '../api/client';

interface NewBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newTitle: string) => void;
  onRequestIdentity: (action: () => void) => void;
}

export const NewBoardModal: React.FC<NewBoardModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onRequestIdentity,
}) => {
  const [title, setTitle] = useState('NEW INVESTIGATION CASE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const executeCreate = async () => {
    try {
      setLoading(true);
      setError(null);
      const cleanTitle = title.trim() || 'NEW INVESTIGATION CASE';
      await api.createNewBoard(cleanTitle);
      onSuccess(cleanTitle);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail || 'Failed to create new board.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRequestIdentity(executeCreate);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-stone-900 border border-stone-700 rounded-lg shadow-2xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="bg-stone-950 p-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-amber-500" />
            <h3 className="font-mono text-sm font-bold tracking-wider text-amber-400 uppercase">
              NEW EMPTY CASE BOARD
            </h3>
          </div>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 rounded text-xs font-mono">
              {error}
            </div>
          )}

          {/* Warning banner */}
          <div className="p-3 bg-amber-950/40 border border-amber-800/80 rounded flex items-start gap-2.5 text-xs text-amber-300 font-mono">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Starting a new board will clear all current evidence photos, pins, and threads. This starts a fresh empty crazy wall.
            </p>
          </div>

          <div>
            <label className="block font-mono text-xs text-stone-300 uppercase tracking-wide mb-2">
              New Case File Name
            </label>
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. CASE FILE #8493: THE HARBOR VAULT"
              className="w-full bg-stone-950 border border-stone-700 rounded px-3.5 py-2.5 text-stone-100 font-mono text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all uppercase tracking-wide"
              required
            />
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
              className="flex items-center gap-1.5 px-5 py-2 rounded bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-bold font-mono text-xs uppercase tracking-wider transition-colors shadow-lg"
            >
              <Check className="w-4 h-4" />
              <span>Create Empty Board</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

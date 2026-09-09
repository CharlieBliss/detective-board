import React, { useState, useEffect } from 'react';
import { X, Check, Edit3 } from 'lucide-react';
import { api } from '../api/client';


interface EditBoardNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onRequestIdentity: (action: () => void) => void;
  currentTitle: string;
}

export const EditBoardNameModal: React.FC<EditBoardNameModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onRequestIdentity,
  currentTitle,
}) => {
  const [title, setTitle] = useState(currentTitle);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(currentTitle);
    setError(null);
  }, [currentTitle, isOpen]);

  if (!isOpen) return null;

  const executeUpdate = async () => {
    try {
      setLoading(true);
      setError(null);
      await api.updateBoardTitle(title.trim());
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail || 'Failed to update board title.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onRequestIdentity(executeUpdate);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-stone-900 border border-stone-700 rounded-lg shadow-2xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="bg-stone-950 p-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-amber-500" />
            <h3 className="font-mono text-sm font-bold tracking-wider text-amber-400 uppercase">
              RENAME CASE BOARD
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

          <div>
            <label className="block font-mono text-xs text-stone-300 uppercase tracking-wide mb-2">
              Investigation Case Title *
            </label>
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. CASE FILE #8492: THE WATERFRONT HEIST"
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
              className="flex items-center gap-1.5 px-5 py-2 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-stone-950 font-bold font-mono text-xs uppercase tracking-wider transition-colors shadow-lg"
            >
              <Check className="w-4 h-4" />
              <span>Save Name</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

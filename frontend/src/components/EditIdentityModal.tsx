import React, { useState } from 'react';
import { Shield, Check, X } from 'lucide-react';

interface EditIdentityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (username: string) => void;
  initialValue?: string;
}

export const EditIdentityModal: React.FC<EditIdentityModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialValue = '',
}) => {
  const [name, setName] = useState(
    initialValue || localStorage.getItem('detective_username') || ''
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const cleanName = name.trim();
    localStorage.setItem('detective_username', cleanName);
    onSave(cleanName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-stone-900 border border-stone-700 rounded-lg shadow-2xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="bg-stone-950 p-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-500" />
            <h3 className="font-mono text-sm font-bold tracking-wider text-amber-400 uppercase">
              INVESTIGATOR CREDENTIALS
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-500 hover:text-stone-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block font-mono text-xs text-stone-300 uppercase tracking-wide mb-2">
              Who is making these changes?
            </label>
            <p className="text-xs text-stone-400 font-sans mb-3">
              Your identifier will be recorded on all evidence updates and new threads under the case honor system.
            </p>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Detective Miller, Inspector Vance"
              className="w-full bg-stone-950 border border-stone-700 rounded px-3.5 py-2.5 text-stone-100 font-mono text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded text-xs font-mono text-stone-400 hover:text-stone-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-stone-950 font-bold font-mono text-xs uppercase tracking-wider transition-colors shadow-lg"
            >
              <Check className="w-4 h-4" />
              <span>Confirm Identity</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import type { BoardNode, NodeType } from '../types/board';

import { api } from '../api/client';
import { X, Check, FilePlus2, User, MapPin, Lightbulb } from 'lucide-react';

interface NodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onRequestIdentity: (action: () => void) => void;
  nodeToEdit?: BoardNode | null;
}

export const NodeModal: React.FC<NodeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onRequestIdentity,
  nodeToEdit,
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<NodeType>('person');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (nodeToEdit) {
      setTitle(nodeToEdit.title);
      setType(nodeToEdit.type);
      setDescription(nodeToEdit.description || '');
      setImageUrl(nodeToEdit.image_url || '');
    } else {
      setTitle('');
      setType('person');
      setDescription('');
      setImageUrl('');
    }
    setError(null);
  }, [nodeToEdit, isOpen]);

  if (!isOpen) return null;

  const executeSave = async () => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        title: title.trim(),
        type,
        description: description.trim() || undefined,
        image_url: imageUrl.trim() || undefined,
      };

      if (nodeToEdit) {
        await api.updateNode(nodeToEdit.id, payload);
      } else {
        await api.createNode(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail || 'Failed to save evidence node.');
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
      <div className="w-full max-w-lg bg-stone-900 border border-stone-700 rounded-lg shadow-2xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="bg-stone-950 p-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FilePlus2 className="w-5 h-5 text-amber-500" />
            <h3 className="font-mono text-sm font-bold tracking-wider text-amber-400 uppercase">
              {nodeToEdit ? 'EDIT EVIDENCE DOSSIER' : 'ADD NEW EVIDENCE NODE'}
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
            <label className="block font-mono text-xs text-stone-300 uppercase tracking-wide mb-1.5">
              Evidence Title / Name *
            </label>
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Vincent Marcone, The Velvet Room, Blueprint"
              className="w-full bg-stone-950 border border-stone-700 rounded px-3 py-2 text-stone-100 font-mono text-sm focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div>
            <label className="block font-mono text-xs text-stone-300 uppercase tracking-wide mb-1.5">
              Category / Type *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'person', label: 'Person', icon: User, color: 'text-amber-500' },
                { id: 'place', label: 'Place', icon: MapPin, color: 'text-emerald-500' },
                { id: 'concept', label: 'Concept / Item', icon: Lightbulb, color: 'text-blue-500' },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = type === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setType(item.id as NodeType)}
                    className={`flex items-center justify-center gap-1.5 p-2.5 rounded border text-xs font-mono transition-all ${
                      isSelected
                        ? 'bg-amber-950/60 border-amber-500 text-amber-300 font-bold'
                        : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block font-mono text-xs text-stone-300 uppercase tracking-wide mb-1.5">
              Image URL (Optional)
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://... (Photo or evidence graphic)"
              className="w-full bg-stone-950 border border-stone-700 rounded px-3 py-2 text-stone-100 font-mono text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block font-mono text-xs text-stone-300 uppercase tracking-wide mb-1.5">
              Description / Case Notes
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Details, witness testimonies, sightings..."
              className="w-full bg-stone-950 border border-stone-700 rounded p-3 text-stone-100 font-sans text-sm focus:outline-none focus:border-amber-500"
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
              <span>{nodeToEdit ? 'Save Changes' : 'Pin to Board'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

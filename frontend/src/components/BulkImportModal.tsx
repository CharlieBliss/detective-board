import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, X, Sparkles } from 'lucide-react';
import { api } from '../api/client';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onRequestIdentity: (action: () => void) => void;
}

const SAMPLE_DATA = {
  nodes: [
    {
      id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
      title: "Vincent 'Viper' Marcone",
      type: "person",
      description: "Notorious underworld enforcer. Rumored to be coordinating illicit diamond transport through the shipping harbor.",
      image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80"
    },
    {
      id: "b2c3d4e5-f6a1-4b5c-9d0e-1f2a3b4c5d6e",
      title: "Evelyn Reed",
      type: "person",
      description: "Star chanteuse at The Velvet Room. Possesses intimate knowledge of city hall officials and illicit payoffs.",
      image_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80"
    },
    {
      id: "c3d4e5f6-a1b2-4c5d-0e1f-2a3b4c5d6e7f",
      title: "Silas Thorne",
      type: "person",
      description: "Black-market broker and antiquities dealer. Operates behind a pawnshop facade on 4th Street.",
      image_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80"
    },
    {
      id: "d4e5f6a1-b2c3-4d5e-1f2a-3b4c5d6e7f8a",
      title: "The Velvet Room",
      type: "place",
      description: "Subterranean jazz lounge where shadowy figures, bootleggers, and politicians convene under dim red lights.",
      image_url: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=300&auto=format&fit=crop&q=80"
    },
    {
      id: "e5f6a1b2-c3d4-4e5f-2a3b-4c5d6e7f8a9b",
      title: "Pier 42 Warehouse",
      type: "place",
      description: "Derelict coastal warehouse with rusted cranes. Site of late-night shipping crate transfers without manifest records.",
      image_url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=300&auto=format&fit=crop&q=80"
    },
    {
      id: "f6a1b2c3-d4e5-4f6a-3b4c-5d6e7f8a9b0c",
      title: "Grand Pacific Vault",
      type: "place",
      description: "Fortified vault deposit where safety box #314 was breached during the thunderstorm of October 14th.",
      image_url: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f3?w=300&auto=format&fit=crop&q=80"
    },
    {
      id: "11111111-2222-3333-4444-555555555555",
      title: "The Blue Star Diamond",
      type: "concept",
      description: "A rare 45-carat sapphire-blue diamond, vanished from safety deposit box #314 without tripping perimeter sensors.",
      image_url: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=300&auto=format&fit=crop&q=80"
    },
    {
      id: "22222222-3333-4444-5555-666666666666",
      title: "The Albatross Ledger",
      type: "concept",
      description: "Leather-bound cipher book detailing bribes paid to harbor customs inspectors and precinct captains.",
      image_url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&auto=format&fit=crop&q=80"
    },
    {
      id: "33333333-4444-5555-6666-777777777777",
      title: "Midnight Drop",
      type: "concept",
      description: "Scheduled exchange coordinated via telegraph codes for 02:00 hours at low tide under the fog.",
      image_url: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=300&auto=format&fit=crop&q=80"
    },
    {
      id: "44444444-5555-6666-7777-888888888888",
      title: "Cyanide Vials",
      type: "concept",
      description: "Pharmaceutical glass ampoules labeled 'Reagent B' discovered behind the condenser coils at Pier 42.",
      image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80"
    }
  ],
  threads: [
    {
      id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      title: "The Vault Infiltration Syndicate",
      description: "Connecting the inside man, fencing operative, breached vault, and stolen gem.",
      connected_nodes: [
        "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
        "c3d4e5f6-a1b2-4c5d-0e1f-2a3b4c5d6e7f",
        "f6a1b2c3-d4e5-4f6a-3b4c-5d6e7f8a9b0c",
        "11111111-2222-3333-4444-555555555555"
      ]
    },
    {
      id: "bbbbbbbb-cccc-dddd-eeee-ffffffffffff",
      title: "Speakeasy Payoff Channel",
      description: "Evelyn Reed acts as courier exchanging ledger codes with informants in the back booths.",
      connected_nodes: [
        "b2c3d4e5-f6a1-4b5c-9d0e-1f2a3b4c5d6e",
        "d4e5f6a1-b2c3-4d5e-1f2a-3b4c5d6e7f8a",
        "22222222-3333-4444-5555-666666666666"
      ]
    },
    {
      id: "cccccccc-dddd-eeee-ffff-000000000000",
      title: "Pier 42 Midnight Poison Protocol",
      description: "Viper Marcone staged the midnight drop at Pier 42 with cyanide vials prepared in case of police intervention.",
      connected_nodes: [
        "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
        "e5f6a1b2-c3d4-4e5f-2a3b-4c5d6e7f8a9b",
        "33333333-4444-5555-6666-777777777777",
        "44444444-5555-6666-7777-888888888888"
      ]
    },
    {
      id: "dddddddd-eeee-ffff-0000-111111111111",
      title: "Blackmail Over the Cipher Ledger",
      description: "Thorne attempted to blackmail Evelyn using pages stolen from the Albatross Ledger.",
      connected_nodes: [
        "c3d4e5f6-a1b2-4c5d-0e1f-2a3b4c5d6e7f",
        "b2c3d4e5-f6a1-4b5c-9d0e-1f2a3b4c5d6e",
        "22222222-3333-4444-5555-666666666666"
      ]
    }
  ]
};

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onRequestIdentity,
}) => {
  const [jsonText, setJsonText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setJsonText(event.target?.result as string || '');
      setError(null);
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    setJsonText(JSON.stringify(SAMPLE_DATA, null, 2));
    setError(null);
  };

  const executeImport = async () => {
    try {
      setLoading(true);
      setError(null);
      const parsed = JSON.parse(jsonText);

      if (!parsed.nodes && !parsed.threads) {
        throw new Error('JSON must contain "nodes" or "threads" arrays.');
      }

      await api.importBoard({
        nodes: parsed.nodes || [],
        threads: parsed.threads || [],
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail || err.message || 'Import failed. Check JSON format.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRequestIdentity(executeImport);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-stone-900 border border-stone-700 rounded-lg shadow-2xl overflow-hidden animate-fadeIn flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-stone-950 p-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-amber-500" />
            <h3 className="font-mono text-sm font-bold tracking-wider text-amber-400 uppercase">
              BULK IMPORT CASE DOSSIER (JSON)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-500 hover:text-stone-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-stone-800">
            <p className="text-xs text-stone-400 font-sans">
              Provide JSON containing flat arrays of <code className="text-amber-300">nodes</code> and <code className="text-red-400">threads</code>.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLoadSample}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-stone-800 hover:bg-stone-750 border border-stone-700 text-amber-300 hover:text-amber-200 text-xs font-mono transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Sample Case</span>
              </button>
              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-stone-800 hover:bg-stone-750 border border-stone-700 text-stone-300 hover:text-stone-100 text-xs font-mono cursor-pointer transition-colors">
                <FileText className="w-3.5 h-3.5" />
                <span>Upload .json</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 rounded text-xs flex items-center gap-2 font-mono">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <textarea
              rows={14}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder={`{\n  "nodes": [\n    { "title": "Suspect Name", "type": "person", "description": "..." }\n  ],\n  "threads": [\n    { "title": "Thread Title", "connected_nodes": [] }\n  ]\n}`}
              className="w-full bg-stone-950 border border-stone-800 rounded p-3 text-stone-200 font-mono text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-mono leading-relaxed"
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
              disabled={loading || !jsonText.trim()}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-stone-950 font-bold font-mono text-xs uppercase tracking-wider transition-colors shadow-lg"
            >
              {loading ? (
                <span>Importing Dossier...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Execute Bulk Upsert</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

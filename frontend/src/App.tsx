import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  NodeChange,
  EdgeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import type { BoardState, SelectedEntity, HoverInfo, BoardNode, BoardThread } from './types/board';
import { api } from './api/client';
import { translateBoardToFlow } from './utils/graphTranslation';

import { Corkboard } from './components/Corkboard';
import { Toolbar } from './components/Toolbar';
import { DetailPanel } from './components/DetailPanel';
import { FloatingTooltip } from './components/FloatingTooltip';
import { EditIdentityModal } from './components/EditIdentityModal';
import { BulkImportModal } from './components/BulkImportModal';
import { NodeModal } from './components/NodeModal';
import { ThreadModal } from './components/ThreadModal';
import { AudioPlayer } from './components/AudioPlayer';

export const App: React.FC = () => {
  // Board Data State
  const [boardState, setBoardState] = useState<BoardState>({ nodes: [], threads: [] });
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);


  // Selection & Hover State
  const [selected, setSelected] = useState<SelectedEntity>(null);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);

  // Cached positions of nodes on canvas so drags are preserved
  const [positions, setPositions] = useState<{ [id: string]: { x: number; y: number } }>({});

  // Modals & Identity
  const [isIdentityModalOpen, setIsIdentityModalOpen] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(
    localStorage.getItem('detective_username')
  );

  const [isBulkImportOpen, setIsBulkImportOpen] = useState<boolean>(false);
  const [isNodeModalOpen, setIsNodeModalOpen] = useState<boolean>(false);
  const [nodeToEdit, setNodeToEdit] = useState<BoardNode | null>(null);
  const [isThreadModalOpen, setIsThreadModalOpen] = useState<boolean>(false);
  const [threadToEdit, setThreadToEdit] = useState<BoardThread | null>(null);

  // Fetch Board from Backend
  const loadBoard = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await api.getBoard();
      setBoardState(data);
    } catch (err: any) {
      console.error('Failed to load board data:', err);
      setErrorMessage('Could not connect to investigation server. Please check the backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  // Intercept actions that require Detective identity
  const requireIdentity = useCallback((action: () => void) => {
    const saved = localStorage.getItem('detective_username');
    if (saved && saved.trim()) {
      setCurrentUsername(saved.trim());
      action();
    } else {
      setPendingAction(() => action);
      setIsIdentityModalOpen(true);
    }
  }, []);

  const handleIdentitySaved = (username: string) => {
    setCurrentUsername(username);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  // Convert board state + selection + positions into React Flow elements
  const { nodes: flowNodes, edges: flowEdges } = useMemo(() => {
    return translateBoardToFlow(boardState, selected, positions);
  }, [boardState, selected, positions]);

  // React Flow node drag and change handler
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // If position change occurred, record new coordinates
      changes.forEach((change) => {
        if (change.type === 'position' && change.position) {
          setPositions((prev) => ({
            ...prev,
            [change.id]: { x: change.position!.x, y: change.position!.y },
          }));
        }
      });
    },
    []
  );

  const onEdgesChange = useCallback((_changes: EdgeChange[]) => {
    // Edge changes handled declaratively
  }, []);


  // Synchronize selected entity if boardState updates
  useEffect(() => {
    if (!selected) return;
    if (selected.type === 'node') {
      const updated = boardState.nodes.find((n) => n.id === selected.data.id);
      if (updated) setSelected({ type: 'node', data: updated });
      else setSelected(null);
    } else if (selected.type === 'thread') {
      const updated = boardState.threads.find((t) => t.id === selected.data.id);
      if (updated) setSelected({ type: 'thread', data: updated });
      else setSelected(null);
    }
  }, [boardState]);

  // Action handlers
  const handleOpenAddNode = () => {
    setNodeToEdit(null);
    setIsNodeModalOpen(true);
  };

  const handleOpenEditNode = () => {
    if (selected && selected.type === 'node') {
      setNodeToEdit(selected.data);
      setIsNodeModalOpen(true);
    }
  };

  const handleDeleteNode = () => {
    if (!selected || selected.type !== 'node') return;
    requireIdentity(async () => {
      if (window.confirm(`Permanently remove evidence "${selected.data.title}" from the board?`)) {
        try {
          await api.deleteNode(selected.data.id);
          setSelected(null);
          await loadBoard();
        } catch (err) {
          console.error(err);
          alert('Failed to delete node.');
        }
      }
    });
  };

  const handleOpenAddThread = () => {
    setThreadToEdit(null);
    setIsThreadModalOpen(true);
  };

  const handleOpenEditThread = () => {
    if (selected && selected.type === 'thread') {
      setThreadToEdit(selected.data);
      setIsThreadModalOpen(true);
    }
  };

  const handleDeleteThread = () => {
    if (!selected || selected.type !== 'thread') return;
    requireIdentity(async () => {
      if (window.confirm(`Unravel thread "${selected.data.title}"?`)) {
        try {
          await api.deleteThread(selected.data.id);
          setSelected(null);
          await loadBoard();
        } catch (err) {
          console.error(err);
          alert('Failed to delete thread.');
        }
      }
    });
  };

  const handleLoadSample = async () => {
    requireIdentity(async () => {
      try {
        setLoading(true);
        // Load sample data into board
        const response = await fetch('/sample_data.json').catch(() => null);
        let sampleData;
        if (response && response.ok) {
          sampleData = await response.json();
        } else {
          // Import fallback from import modal
          setIsBulkImportOpen(true);
          return;
        }
        await api.importBoard(sampleData);
        await loadBoard();
      } catch (e) {
        setIsBulkImportOpen(true);
      } finally {
        setLoading(false);
      }
    });
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-stone-950 font-sans">
      {/* Top Header & Toolbar */}
      <Toolbar
        boardState={boardState}
        onAddNode={handleOpenAddNode}
        onAddThread={handleOpenAddThread}
        onBulkImport={() => setIsBulkImportOpen(true)}
        onRefresh={loadBoard}
        onLoadSample={handleLoadSample}
        onEditIdentity={() => setIsIdentityModalOpen(true)}
        currentUsername={currentUsername}
        loading={loading}
      />

      {/* Connection Warning Banner */}
      {errorMessage && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-red-950/90 border border-red-800 text-red-200 px-4 py-2 rounded-md shadow-2xl text-xs font-mono flex items-center gap-2">
          <span>⚠️ {errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-red-200 ml-2 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Corkboard Graph Area */}

      <main className="w-full h-full">
        <Corkboard
          nodes={flowNodes}
          edges={flowEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          boardState={boardState}
          selected={selected}
          onSelectEntity={setSelected}
          onHover={setHoverInfo}
        />
      </main>

      {/* Floating Hover Tooltip */}
      <FloatingTooltip info={hoverInfo} />

      {/* Sliding Detail Dossier Panel */}
      <DetailPanel
        selected={selected}
        boardState={boardState}
        onClose={() => setSelected(null)}
        onEdit={() => {
          if (selected?.type === 'node') handleOpenEditNode();
          else handleOpenEditThread();
        }}
        onDelete={() => {
          if (selected?.type === 'node') handleDeleteNode();
          else handleDeleteThread();
        }}
        onSelectNode={(node) => setSelected({ type: 'node', data: node })}
        onSelectThread={(thread) => setSelected({ type: 'thread', data: thread })}
      />

      {/* Background Audio Player (Persistent bottom-left toggle) */}
      <AudioPlayer />

      {/* Modals */}
      <EditIdentityModal
        isOpen={isIdentityModalOpen}
        onClose={() => {
          setIsIdentityModalOpen(false);
          setPendingAction(null);
        }}
        onSave={handleIdentitySaved}
        initialValue={currentUsername || ''}
      />

      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onSuccess={() => loadBoard()}
        onRequestIdentity={requireIdentity}
      />

      <NodeModal
        isOpen={isNodeModalOpen}
        onClose={() => setIsNodeModalOpen(false)}
        onSuccess={() => loadBoard()}
        onRequestIdentity={requireIdentity}
        nodeToEdit={nodeToEdit}
      />

      <ThreadModal
        isOpen={isThreadModalOpen}
        onClose={() => setIsThreadModalOpen(false)}
        onSuccess={() => loadBoard()}
        onRequestIdentity={requireIdentity}
        threadToEdit={threadToEdit}
        availableNodes={boardState.nodes}
      />
    </div>
  );
};

export default App;

import React, { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
} from '@xyflow/react';
import type {
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  NodeMouseHandler,
  EdgeMouseHandler,
  NodeTypes,
} from '@xyflow/react';
import { EntityNode } from './EntityNode';
import { ThreadHubNode } from './ThreadHubNode';
import type { HoverInfo, SelectedEntity, BoardState } from '../types/board';

interface CorkboardProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  boardState: BoardState;
  selected: SelectedEntity;
  onSelectEntity: (selected: SelectedEntity) => void;
  onHover: (info: HoverInfo | null) => void;
}

export const Corkboard: React.FC<CorkboardProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  boardState,
  onSelectEntity,
  onHover,
}) => {

  // Register custom node types
  const nodeTypes: NodeTypes = useMemo(
    () => ({
      entity: EntityNode,
      threadHub: ThreadHubNode,
    }),
    []
  );

  // Handle Node Hover
  const handleNodeMouseEnter: NodeMouseHandler = useCallback(
    (event, node) => {
      const isEntity = node.type === 'entity';
      const data = node.data as any;

      onHover({
        x: event.clientX,
        y: event.clientY,
        title: data.title || '',
        type: isEntity ? data.type : 'Thread / Hyperedge',
        description: data.description || 'No description provided.',
        last_edited_by: data.last_edited_by,
      });
    },
    [onHover]
  );

  const handleNodeMouseLeave = useCallback(() => {
    onHover(null);
  }, [onHover]);

  // Handle Edge Hover
  const handleEdgeMouseEnter: EdgeMouseHandler = useCallback(
    (event, edge) => {
      const edgeData = edge.data as any;
      if (!edgeData) return;

      onHover({
        x: event.clientX,
        y: event.clientY,
        title: edgeData.threadTitle ? `THREAD: ${edgeData.threadTitle}` : 'Red String',
        type: 'Connection',
        description: edgeData.threadDescription || 'Connects evidence to thread hub.',
      });
    },
    [onHover]
  );

  const handleEdgeMouseLeave = useCallback(() => {
    onHover(null);
  }, [onHover]);

  // Handle Node Click
  const handleNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      if (node.type === 'entity') {
        const fullNode = boardState.nodes.find((n) => n.id === node.id);
        if (fullNode) {
          onSelectEntity({ type: 'node', data: fullNode });
        }
      } else if (node.type === 'threadHub') {
        const fullThread = boardState.threads.find((t) => t.id === node.id);
        if (fullThread) {
          onSelectEntity({ type: 'thread', data: fullThread });
        }
      }
    },
    [boardState, onSelectEntity]
  );

  // Clicking on background resets selection
  const handlePaneClick = useCallback(() => {
    onSelectEntity(null);
  }, [onSelectEntity]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-stone-950 select-none">
      {/* Corkboard Texture Background with Vignette */}
      <div
        className="absolute inset-0 pointer-events-none opacity-45"
        style={{
          backgroundImage: `
            radial-gradient(#d97706 0.75px, transparent 0.75px),
            radial-gradient(#b45309 0.75px, #292524 0.75px)
          `,
          backgroundSize: '16px 16px',
          backgroundPosition: '0 0, 8px 8px',
        }}
      />
      {/* Vignette Shadow Overlay */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_120px_rgba(0,0,0,0.85)] z-10" />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeMouseEnter={handleNodeMouseEnter}
        onNodeMouseLeave={handleNodeMouseLeave}
        onEdgeMouseEnter={handleEdgeMouseEnter}
        onEdgeMouseLeave={handleEdgeMouseLeave}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2.0}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#44403c" gap={32} size={1} />
        <Controls

          className="bg-stone-900 border border-stone-700 text-stone-300 fill-stone-300 rounded shadow-xl [&>button]:border-stone-700 [&>button]:bg-stone-900 [&>button:hover]:bg-stone-800"
          style={{ bottom: 20, right: 20 }}
        />
        <MiniMap
          nodeColor={(n) => {
            if (n.type === 'threadHub') return '#ef4444';
            const data = n.data as any;
            if (data?.type === 'person') return '#f59e0b';
            if (data?.type === 'place') return '#10b981';
            return '#3b82f6';
          }}
          maskColor="rgba(12, 10, 9, 0.75)"
          className="bg-stone-950 border border-stone-800 rounded shadow-2xl"
          style={{ bottom: 20, right: 80, width: 140, height: 90 }}
        />
      </ReactFlow>
    </div>
  );
};

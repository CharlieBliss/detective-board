import type { Node, Edge } from '@xyflow/react';
import type { BoardState, EntityNodeData, ThreadHubData, SelectedEntity } from '../types/board';


interface PositionMap {
  [id: string]: { x: number; y: number };
}

export function translateBoardToFlow(
  board: BoardState,
  selected: SelectedEntity,
  existingPositions: PositionMap = {}
): {
  nodes: Node[];
  edges: Edge[];
  positions: PositionMap;
} {
  const positions: PositionMap = { ...existingPositions };

  // Calculate default positions for entity nodes if not set
  const entityCount = board.nodes.length;
  const radius = Math.max(350, entityCount * 45);
  const centerX = 650;
  const centerY = 450;

  board.nodes.forEach((node, index) => {
    if (!positions[node.id]) {
      // Semi-randomized organic circle/oval layout
      const angle = (index / Math.max(1, entityCount)) * 2 * Math.PI - Math.PI / 2;
      const jitterX = ((index * 37) % 80) - 40;
      const jitterY = ((index * 47) % 80) - 40;
      const x = centerX + Math.cos(angle) * (radius + jitterX);
      const y = centerY + Math.sin(angle) * (radius * 0.7 + jitterY);
      positions[node.id] = { x: Math.round(x), y: Math.round(y) };
    }
  });

  // Calculate positions for thread hubs (place near centroid of connected nodes)
  board.threads.forEach((thread, index) => {
    if (!positions[thread.id]) {
      const connected = thread.connected_nodes
        .map((nid) => positions[nid])
        .filter(Boolean);

      if (connected.length > 0) {
        const avgX = connected.reduce((sum, p) => sum + p.x, 0) / connected.length;
        const avgY = connected.reduce((sum, p) => sum + p.y, 0) / connected.length;
        // slight deterministic offset so multiple threads sharing nodes don't stack exactly
        const offsetX = ((index * 43) % 90) - 45;
        const offsetY = ((index * 53) % 90) - 45;
        positions[thread.id] = {
          x: Math.round(avgX + offsetX),
          y: Math.round(avgY + offsetY),
        };
      } else {
        // Fallback for floating thread
        positions[thread.id] = {
          x: centerX + (index - board.threads.length / 2) * 120,
          y: centerY - 200,
        };
      }
    }
  });

  // Determine selection / dimming states
  const isAnySelected = selected !== null;
  const selectedId = selected?.data.id;
  const selectedType = selected?.type;

  // Find IDs that should be illuminated
  const illuminatedNodeIds = new Set<string>();
  const illuminatedThreadIds = new Set<string>();
  const illuminatedEdgeIds = new Set<string>();

  if (selectedType === 'node' && selectedId) {
    illuminatedNodeIds.add(selectedId);
    board.threads.forEach((t) => {
      if (t.connected_nodes.includes(selectedId)) {
        illuminatedThreadIds.add(t.id);
        illuminatedEdgeIds.add(`edge-${selectedId}-${t.id}`);
      }
    });
  } else if (selectedType === 'thread' && selectedId) {
    illuminatedThreadIds.add(selectedId);
    const targetThread = board.threads.find((t) => t.id === selectedId);
    if (targetThread) {
      targetThread.connected_nodes.forEach((nid) => {
        illuminatedNodeIds.add(nid);
        illuminatedEdgeIds.add(`edge-${nid}-${selectedId}`);
      });
    }
  }

  // Build React Flow Entity Nodes
  const flowNodes: Node[] = [];

  board.nodes.forEach((node) => {
    const isSelected = selectedType === 'node' && selectedId === node.id;
    const isConnected = illuminatedNodeIds.has(node.id) && !isSelected;
    const isDimmed = isAnySelected && !isSelected && !isConnected;

    const data: EntityNodeData = {
      id: node.id,
      title: node.title,
      type: node.type,
      description: node.description,
      image_url: node.image_url,
      last_edited_by: node.last_edited_by,
      isDimmed,
      isSelected,
      isConnectedToSelected: isConnected,
    };

    flowNodes.push({
      id: node.id,
      type: 'entity',
      position: positions[node.id] || { x: 0, y: 0 },
      data,
      zIndex: isSelected ? 20 : isConnected ? 15 : 5,
    });
  });

  // Build React Flow Thread Hub Nodes
  board.threads.forEach((thread) => {
    const isSelected = selectedType === 'thread' && selectedId === thread.id;
    const isConnected = illuminatedThreadIds.has(thread.id) && !isSelected;
    const isDimmed = isAnySelected && !isSelected && !isConnected;

    const data: ThreadHubData = {
      id: thread.id,
      title: thread.title,
      description: thread.description,
      connected_nodes: thread.connected_nodes,
      last_edited_by: thread.last_edited_by,
      isDimmed,
      isSelected,
      isConnectedToSelected: isConnected,
    };

    flowNodes.push({
      id: thread.id,
      type: 'threadHub',
      position: positions[thread.id] || { x: 0, y: 0 },
      data,
      zIndex: isSelected ? 25 : isConnected ? 18 : 10,
    });
  });

  // Build React Flow Edges (Red string connecting entity nodes to thread hub)
  const flowEdges: Edge[] = [];

  board.threads.forEach((thread) => {
    thread.connected_nodes.forEach((nodeId) => {
      // Ensure the connected node actually exists in board
      const nodeExists = board.nodes.some((n) => n.id === nodeId);
      if (!nodeExists) return;

      const edgeId = `edge-${nodeId}-${thread.id}`;
      const isIlluminated = illuminatedEdgeIds.has(edgeId);
      const isDimmed = isAnySelected && !isIlluminated;

      flowEdges.push({
        id: edgeId,
        source: nodeId,
        target: thread.id,
        type: 'default',
        animated: isIlluminated,
        data: {
          threadTitle: thread.title,
          threadDescription: thread.description,
          threadId: thread.id,
        },
        style: {
          stroke: isIlluminated ? '#ef4444' : isDimmed ? '#991b1b33' : '#dc2626',
          strokeWidth: isIlluminated ? 3.5 : isDimmed ? 1.5 : 2.5,
          opacity: isDimmed ? 0.25 : 1,
          filter: isIlluminated ? 'drop-shadow(0 0 6px rgba(239, 68, 68, 0.8))' : 'none',
          transition: 'all 0.25s ease-in-out',
        },
        zIndex: isIlluminated ? 12 : 2,
      });
    });
  });

  return {
    nodes: flowNodes,
    edges: flowEdges,
    positions,
  };
}

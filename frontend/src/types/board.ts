export type NodeType = 'person' | 'place' | 'concept';

export interface BoardNode {
  id: string;
  title: string;
  type: NodeType;
  description?: string | null;
  image_url?: string | null;
  last_edited_by?: string | null;
}

export interface BoardThread {
  id: string;
  title: string;
  description?: string | null;
  connected_nodes: string[];
  last_edited_by?: string | null;
}

export interface BoardState {
  title?: string;
  last_edited_by?: string | null;
  nodes: BoardNode[];
  threads: BoardThread[];
}


export interface EntityNodeData extends Record<string, unknown> {
  id: string;
  title: string;
  type: NodeType;
  description?: string | null;
  image_url?: string | null;
  last_edited_by?: string | null;
  isDimmed: boolean;
  isSelected: boolean;
  isConnectedToSelected: boolean;
}

export interface ThreadHubData extends Record<string, unknown> {
  id: string;
  title: string;
  description?: string | null;
  connected_nodes: string[];
  last_edited_by?: string | null;
  isDimmed: boolean;
  isSelected: boolean;
  isConnectedToSelected: boolean;
}

export interface HoverInfo {
  x: number;
  y: number;
  title: string;
  type?: string;
  description?: string;
  last_edited_by?: string | null;
}

export type SelectedEntity = 
  | { type: 'node'; data: BoardNode }
  | { type: 'thread'; data: BoardThread }
  | null;

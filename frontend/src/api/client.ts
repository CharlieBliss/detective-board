import axios from 'axios';
import type { BoardNode, BoardState, BoardThread } from '../types/board';


const rawApiUrl = import.meta.env.VITE_API_URL || '/api';
const cleanBaseUrl = rawApiUrl.startsWith('http')
  ? (rawApiUrl.replace(/\/+$/, '').endsWith('/api') ? rawApiUrl.replace(/\/+$/, '') : `${rawApiUrl.replace(/\/+$/, '')}/api`)
  : (rawApiUrl.endsWith('/api') ? rawApiUrl : '/api');

export const apiClient = axios.create({
  baseURL: cleanBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});


// Attach X-User-Name header from localStorage on all requests
apiClient.interceptors.request.use((config) => {
  const username = localStorage.getItem('detective_username');
  if (username) {
    config.headers['X-User-Name'] = username;
  }
  return config;
});

export const api = {
  // Board State
  getBoard: async (): Promise<BoardState> => {
    const res = await apiClient.get<BoardState>('/board');
    return res.data;
  },

  updateBoardTitle: async (title: string): Promise<BoardState> => {
    const res = await apiClient.put<BoardState>('/board', { title });
    return res.data;
  },

  createNewBoard: async (title?: string): Promise<BoardState> => {
    const res = await apiClient.post<BoardState>('/board/new', { title });
    return res.data;
  },


  // Bulk Import
  importBoard: async (data: { nodes: any[]; threads: any[] }) => {
    const res = await apiClient.post('/board/import', data);
    return res.data;
  },

  // Node CRUD
  createNode: async (node: Partial<BoardNode>): Promise<BoardNode> => {
    const res = await apiClient.post<BoardNode>('/nodes', node);
    return res.data;
  },

  updateNode: async (id: string, node: Partial<BoardNode>): Promise<BoardNode> => {
    const res = await apiClient.put<BoardNode>(`/nodes/${id}`, node);
    return res.data;
  },

  deleteNode: async (id: string): Promise<void> => {
    await apiClient.delete(`/nodes/${id}`);
  },

  // Thread CRUD
  createThread: async (thread: Partial<BoardThread>): Promise<BoardThread> => {
    const res = await apiClient.post<BoardThread>('/threads', thread);
    return res.data;
  },

  updateThread: async (id: string, thread: Partial<BoardThread>): Promise<BoardThread> => {
    const res = await apiClient.put<BoardThread>(`/threads/${id}`, thread);
    return res.data;
  },

  deleteThread: async (id: string): Promise<void> => {
    await apiClient.delete(`/threads/${id}`);
  },
};

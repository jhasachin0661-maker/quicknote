import { Note, NoteCreatePayload, NoteUpdatePayload, ApiResponse } from '../types/note';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = `Request failed with status ${res.status}`;
    let bodyData = null;
    try {
      bodyData = await res.json();
      if (bodyData?.detail) {
        if (typeof bodyData.detail === 'string') {
          errorDetail = bodyData.detail;
        } else if (Array.isArray(bodyData.detail)) {
          errorDetail = bodyData.detail.map((e: any) => e.msg || e.message).join(', ');
        }
      } else if (bodyData?.message) {
        errorDetail = bodyData.message;
      }
    } catch {
      // Non-JSON response
    }
    throw new ApiError(errorDetail, res.status, bodyData);
  }
  return res.json();
}

export const notesApi = {
  async getNotes(
    params?: {
      q?: string;
      tag?: string;
      pinned?: boolean;
      favorite?: boolean;
      deleted?: boolean;
      sort_by?: string;
      order?: string;
    },
    signal?: AbortSignal
  ): Promise<ApiResponse<Note[]>> {
    const url = new URL(`${API_BASE_URL}/notes`);
    if (params) {
      if (params.q) url.searchParams.set('q', params.q);
      if (params.tag) url.searchParams.set('tag', params.tag);
      if (params.pinned !== undefined) url.searchParams.set('pinned', String(params.pinned));
      if (params.favorite !== undefined) url.searchParams.set('favorite', String(params.favorite));
      if (params.deleted !== undefined) url.searchParams.set('deleted', String(params.deleted));
      if (params.sort_by) url.searchParams.set('sort_by', params.sort_by);
      if (params.order) url.searchParams.set('order', params.order);
    }

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal,
    });
    return handleResponse<ApiResponse<Note[]>>(res);
  },

  async getNoteById(id: string, signal?: AbortSignal): Promise<ApiResponse<Note>> {
    const res = await fetch(`${API_BASE_URL}/notes/${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal,
    });
    return handleResponse<ApiResponse<Note>>(res);
  },

  async createNote(payload: NoteCreatePayload, signal?: AbortSignal): Promise<ApiResponse<Note>> {
    const res = await fetch(`${API_BASE_URL}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });
    return handleResponse<ApiResponse<Note>>(res);
  },

  async updateNote(id: string, payload: NoteUpdatePayload, signal?: AbortSignal): Promise<ApiResponse<Note>> {
    const res = await fetch(`${API_BASE_URL}/notes/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });
    return handleResponse<ApiResponse<Note>>(res);
  },

  async patchNote(id: string, payload: Partial<NoteUpdatePayload>, signal?: AbortSignal): Promise<ApiResponse<Note>> {
    const res = await fetch(`${API_BASE_URL}/notes/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });
    return handleResponse<ApiResponse<Note>>(res);
  },

  async softDeleteNote(id: string): Promise<ApiResponse<any>> {
    const res = await fetch(`${API_BASE_URL}/notes/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return handleResponse<ApiResponse<any>>(res);
  },

  async permanentDeleteNote(id: string): Promise<ApiResponse<any>> {
    const res = await fetch(`${API_BASE_URL}/notes/${encodeURIComponent(id)}/permanent`, {
      method: 'DELETE',
    });
    return handleResponse<ApiResponse<any>>(res);
  },

  async restoreNote(id: string): Promise<ApiResponse<Note>> {
    const res = await fetch(`${API_BASE_URL}/notes/${encodeURIComponent(id)}/restore`, {
      method: 'POST',
    });
    return handleResponse<ApiResponse<Note>>(res);
  },

  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      return res.ok;
    } catch {
      return false;
    }
  },
};


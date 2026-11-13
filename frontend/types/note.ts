export type NoteColor = 'default' | 'amber' | 'blue' | 'emerald' | 'purple' | 'rose';

export interface Note {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  is_favorite: boolean;
  tags: string[];
  color?: NoteColor;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface NoteCreatePayload {
  title: string;
  content: string;
  is_pinned?: boolean;
  is_favorite?: boolean;
  tags?: string[];
  color?: NoteColor;
}

export interface NoteUpdatePayload {
  title?: string;
  content?: string;
  is_pinned?: boolean;
  is_favorite?: boolean;
  tags?: string[];
  color?: NoteColor;
  is_deleted?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  message?: string;
}

export type SaveStatus = 'saved' | 'saving' | 'error' | 'unsaved';

export type FilterCategory = 'all' | 'pinned' | 'favorites' | 'trash';

export type ViewMode = 'grid' | 'list';

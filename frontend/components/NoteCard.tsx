'use client';

import React from 'react';
import { Pin, Star, Trash2, RotateCcw } from 'lucide-react';
import { Note } from '../types/note';

interface NoteCardProps {
  note: Note;
  isSelected: boolean;
  isTrashView?: boolean;
  onSelect: (note: Note) => void;
  onTogglePin?: (e: React.MouseEvent, note: Note) => void;
  onToggleFavorite?: (e: React.MouseEvent, note: Note) => void;
  onRestore?: (e: React.MouseEvent, note: Note) => void;
  onPermanentDelete?: (e: React.MouseEvent, note: Note) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  isSelected,
  isTrashView = false,
  onSelect,
  onTogglePin,
  onToggleFavorite,
  onRestore,
  onPermanentDelete,
}) => {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const previewSnippet = note.content
    ? note.content.replace(/[#*`\-_]/g, '').trim().substring(0, 90)
    : 'No content';

  return (
    <div
      onClick={() => onSelect(note)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(note);
        }
      }}
      className={`group relative p-4 rounded-xl cursor-pointer text-left transition-all border ${
        isSelected
          ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 shadow-sm'
          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
      }`}
    >
      {/* Header: Title and Indicators */}
      <div className="flex items-start justify-between gap-2">
        <h4
          className={`text-sm font-semibold truncate flex-1 ${
            isSelected
              ? 'text-indigo-900 dark:text-indigo-100'
              : 'text-slate-900 dark:text-slate-100'
          }`}
        >
          {note.title.trim() || 'Untitled Note'}
        </h4>

        {!isTrashView ? (
          <div className="flex items-center gap-1 shrink-0">
            {onTogglePin && (
              <button
                type="button"
                onClick={(e) => onTogglePin(e, note)}
                className={`p-1 rounded-md transition-colors ${
                  note.is_pinned
                    ? 'text-amber-500 hover:text-amber-600'
                    : 'text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400 opacity-0 group-hover:opacity-100'
                }`}
                title={note.is_pinned ? 'Unpin note' : 'Pin note'}
              >
                <Pin className="w-3.5 h-3.5 fill-current" />
              </button>
            )}
            {onToggleFavorite && (
              <button
                type="button"
                onClick={(e) => onToggleFavorite(e, note)}
                className={`p-1 rounded-md transition-colors ${
                  note.is_favorite
                    ? 'text-amber-400 hover:text-amber-500'
                    : 'text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400 opacity-0 group-hover:opacity-100'
                }`}
                title={note.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Star className="w-3.5 h-3.5 fill-current" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1 shrink-0">
            {onRestore && (
              <button
                type="button"
                onClick={(e) => onRestore(e, note)}
                className="p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-md transition-colors"
                title="Restore note"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
            {onPermanentDelete && (
              <button
                type="button"
                onClick={(e) => onPermanentDelete(e, note)}
                className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md transition-colors"
                title="Permanently delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Snippet */}
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
        {previewSnippet}
      </p>

      {/* Footer: Date & Tags */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
        <span>{formatDate(note.updated_at || note.created_at)}</span>

        {note.tags && note.tags.length > 0 && (
          <div className="flex items-center gap-1 overflow-hidden">
            {note.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 rounded-md text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 truncate max-w-[70px]"
              >
                #{tag}
              </span>
            ))}
            {note.tags.length > 2 && (
              <span className="text-[10px] text-slate-400">+{note.tags.length - 2}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};


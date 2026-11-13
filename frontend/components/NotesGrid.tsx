'use client';

import React from 'react';
import { Note, FilterCategory } from '../types/note';
import { SearchBar } from './SearchBar';
import { NoteCard } from './NoteCard';
import { EmptyState } from './EmptyState';
import { NotesListSkeleton } from './LoadingSkeleton';
import { ArrowUpDown, Tag, X } from 'lucide-react';

interface NotesGridProps {
  notes: Note[];
  selectedNoteId: string | null;
  currentFilter: FilterCategory;
  selectedTag: string | null;
  searchQuery: string;
  sortBy: string;
  order: string;
  isLoading: boolean;
  onSelectNote: (note: Note) => void;
  onSearchChange: (query: string) => void;
  onSortChange: (sortBy: string, order: string) => void;
  onClearTag: () => void;
  onTogglePin?: (e: React.MouseEvent, note: Note) => void;
  onToggleFavorite?: (e: React.MouseEvent, note: Note) => void;
  onRestore?: (e: React.MouseEvent, note: Note) => void;
  onPermanentDelete?: (e: React.MouseEvent, note: Note) => void;
  onCreateNote: () => void;
}

export const NotesGrid: React.FC<NotesGridProps> = ({
  notes,
  selectedNoteId,
  currentFilter,
  selectedTag,
  searchQuery,
  sortBy,
  order,
  isLoading,
  onSelectNote,
  onSearchChange,
  onSortChange,
  onClearTag,
  onTogglePin,
  onToggleFavorite,
  onRestore,
  onPermanentDelete,
  onCreateNote,
}) => {
  const getHeaderTitle = () => {
    if (selectedTag) return `#${selectedTag}`;
    switch (currentFilter) {
      case 'pinned':
        return 'Pinned Notes';
      case 'favorites':
        return 'Favorite Notes';
      case 'trash':
        return 'Trash';
      case 'all':
      default:
        return 'All Notes';
    }
  };

  const isTrashView = currentFilter === 'trash';

  // In 'all' view without active search, we can display pinned notes in their own group
  const hasSeparatePinned =
    currentFilter === 'all' && !selectedTag && !searchQuery.trim();
  const pinnedNotes = hasSeparatePinned ? notes.filter((n) => n.is_pinned) : [];
  const otherNotes = hasSeparatePinned ? notes.filter((n) => !n.is_pinned) : notes;

  return (
    <div className="w-80 md:w-96 h-full flex flex-col bg-slate-50/50 dark:bg-slate-900/50 border-r border-slate-200/80 dark:border-slate-800/80 select-none">
      {/* Header & Search */}
      <div className="p-4 space-y-3 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {getHeaderTitle()}
            </h2>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              {notes.length}
            </span>
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center">
            <select
              value={`${sortBy}-${order}`}
              onChange={(e) => {
                const [sb, ord] = e.target.value.split('-');
                onSortChange(sb, ord);
              }}
              className="text-xs bg-transparent border-none text-slate-500 dark:text-slate-400 focus:outline-none cursor-pointer py-1"
            >
              <option value="updated_at-desc" className="dark:bg-slate-900">Recently Updated</option>
              <option value="created_at-desc" className="dark:bg-slate-900">Newest Created</option>
              <option value="title-asc" className="dark:bg-slate-900">Title (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <SearchBar value={searchQuery} onChange={onSearchChange} />

        {/* Active Tag Pill */}
        {selectedTag && (
          <div className="flex items-center gap-1.5 pt-1">
            <span className="text-xs text-slate-400">Filtering tag:</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-medium">
              <Tag className="w-3 h-3" />
              #{selectedTag}
              <button
                type="button"
                onClick={onClearTag}
                className="hover:text-indigo-950 dark:hover:text-indigo-100"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          </div>
        )}
      </div>

      {/* Notes List Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading ? (
          <NotesListSkeleton count={5} />
        ) : notes.length === 0 ? (
          <EmptyState
            type={
              searchQuery
                ? 'search'
                : selectedTag
                ? 'tag'
                : currentFilter
            }
            searchQuery={searchQuery}
            activeTag={selectedTag}
            onCreateNote={onCreateNote}
          />
        ) : (
          <>
            {/* Pinned section if separated */}
            {hasSeparatePinned && pinnedNotes.length > 0 && (
              <div className="space-y-2 mb-4">
                <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-amber-500/80">
                  Pinned ({pinnedNotes.length})
                </p>
                {pinnedNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    isSelected={note.id === selectedNoteId}
                    isTrashView={isTrashView}
                    onSelect={onSelectNote}
                    onTogglePin={onTogglePin}
                    onToggleFavorite={onToggleFavorite}
                    onRestore={onRestore}
                    onPermanentDelete={onPermanentDelete}
                  />
                ))}
                <div className="pt-2">
                  <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Other Notes
                  </p>
                </div>
              </div>
            )}

            {/* Main notes list */}
            {otherNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                isSelected={note.id === selectedNoteId}
                isTrashView={isTrashView}
                onSelect={onSelectNote}
                onTogglePin={onTogglePin}
                onToggleFavorite={onToggleFavorite}
                onRestore={onRestore}
                onPermanentDelete={onPermanentDelete}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
};


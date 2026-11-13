'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Note, FilterCategory, NoteColor, ViewMode } from '../types/note';
import { localNotesStorage } from '../lib/storage';
import { NoteForm } from './NoteForm';
import { ThemeToggle } from './ThemeToggle';
import { ToastNotification, ToastMessage } from './ToastNotification';
import { DeleteConfirmation } from './DeleteConfirmation';
import {
  Plus,
  Search,
  Pin,
  Star,
  Trash2,
  FileText,
  RotateCcw,
  BookOpen,
  X,
  Tag,
  Edit3,
  Download,
  LayoutGrid,
  List,
  Copy,
  ArrowUpDown,
  Sparkles,
} from 'lucide-react';

export const AppLayout: React.FC = () => {
  // App views: 'list' (dashboard) or 'form' (create / edit note screen)
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Notes state
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentFilter, setCurrentFilter] = useState<FilterCategory>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'updated_at' | 'created_at' | 'title'>('updated_at');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Delete modal
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    note: Note | null;
    isPermanent: boolean;
  }>({
    isOpen: false,
    note: null,
    isPermanent: false,
  });

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load notes on mount from browser localStorage
  useEffect(() => {
    const loaded = localNotesStorage.getNotes();
    setNotes(loaded);
  }, []);

  // Filtered and sorted notes
  const filteredNotes = useMemo(() => {
    let result = notes.filter((n) => {
      if (currentFilter === 'trash') {
        return n.is_deleted;
      }
      if (n.is_deleted) return false;

      if (currentFilter === 'pinned' && !n.is_pinned) return false;
      if (currentFilter === 'favorites' && !n.is_favorite) return false;

      if (selectedTag && (!Array.isArray(n.tags) || !n.tags.includes(selectedTag))) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = n.title.toLowerCase().includes(q);
        const matchesContent = n.content.toLowerCase().includes(q);
        if (!matchesTitle && !matchesContent) return false;
      }

      return true;
    });

    // Pinned notes first in active views, then sort order
    result.sort((a, b) => {
      if (currentFilter !== 'trash' && !searchQuery.trim()) {
        if (a.is_pinned !== b.is_pinned) {
          return a.is_pinned ? -1 : 1;
        }
      }

      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      const dateA = new Date(sortBy === 'created_at' ? a.created_at : a.updated_at).getTime();
      const dateB = new Date(sortBy === 'created_at' ? b.created_at : b.updated_at).getTime();
      return dateB - dateA;
    });

    return result;
  }, [notes, currentFilter, selectedTag, searchQuery, sortBy]);

  // Counts
  const counts = useMemo(() => {
    const active = notes.filter((n) => !n.is_deleted);
    return {
      all: active.length,
      pinned: active.filter((n) => n.is_pinned).length,
      favorites: active.filter((n) => n.is_favorite).length,
      trash: notes.filter((n) => n.is_deleted).length,
    };
  }, [notes]);

  // Unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    notes
      .filter((n) => !n.is_deleted)
      .forEach((n) => {
        if (Array.isArray(n.tags)) {
          n.tags.forEach((t) => set.add(t));
        }
      });
    return Array.from(set);
  }, [notes]);

  // Open Create Note Form
  const handleOpenCreateForm = () => {
    setEditingNote(null);
    setView('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open Edit Note Form
  const handleOpenEditForm = (note: Note) => {
    if (note.is_deleted) return;
    setEditingNote(note);
    setView('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Save Note Handler
  const handleSaveNote = (data: {
    title: string;
    content: string;
    tags: string[];
    color: NoteColor;
    is_pinned: boolean;
    is_favorite: boolean;
  }) => {
    if (editingNote) {
      const updated = localNotesStorage.updateNote(editingNote.id, data);
      if (updated) {
        setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
        addToast('success', 'Note updated successfully!');
      }
    } else {
      const created = localNotesStorage.createNote(data);
      setNotes((prev) => [created, ...prev]);
      addToast('success', 'Note saved successfully!');
    }
    setView('list');
    setEditingNote(null);
  };

  // Toggle Pin
  const handleTogglePin = (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    const updated = localNotesStorage.updateNote(note.id, { is_pinned: !note.is_pinned });
    if (updated) {
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      addToast('info', updated.is_pinned ? 'Pinned to top' : 'Unpinned');
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    const updated = localNotesStorage.updateNote(note.id, { is_favorite: !note.is_favorite });
    if (updated) {
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      addToast('info', updated.is_favorite ? 'Added to favorites' : 'Removed from favorites');
    }
  };

  // Delete Request Modal
  const handleDeleteClick = (e: React.MouseEvent | null, note: Note) => {
    if (e) e.stopPropagation();
    setDeleteModal({
      isOpen: true,
      note,
      isPermanent: currentFilter === 'trash' || note.is_deleted,
    });
  };

  // Confirm Deletion
  const handleConfirmDelete = () => {
    const target = deleteModal.note;
    if (!target) return;

    if (deleteModal.isPermanent) {
      localNotesStorage.permanentDeleteNote(target.id);
      setNotes((prev) => prev.filter((n) => n.id !== target.id));
      addToast('success', 'Note permanently deleted');
    } else {
      localNotesStorage.softDeleteNote(target.id);
      setNotes((prev) =>
        prev.map((n) => (n.id === target.id ? { ...n, is_deleted: true } : n))
      );
      addToast('success', 'Note moved to Trash');
    }

    setDeleteModal({ isOpen: false, note: null, isPermanent: false });
    if (view === 'form') {
      setView('list');
      setEditingNote(null);
    }
  };

  // Restore Note from Trash
  const handleRestoreNote = (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    const restored = localNotesStorage.restoreNote(note.id);
    if (restored) {
      setNotes((prev) => prev.map((n) => (n.id === restored.id ? restored : n)));
      addToast('success', 'Note restored to active notes!');
    }
  };

  // Empty Trash
  const handleEmptyTrash = () => {
    if (confirm('Are you sure you want to permanently delete all notes in Trash?')) {
      localNotesStorage.emptyTrash();
      setNotes((prev) => prev.filter((n) => !n.is_deleted));
      addToast('success', 'Trash emptied');
    }
  };

  // Copy Note Content
  const handleCopyNote = (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    const textToCopy = `${note.title}\n\n${note.content}`;
    navigator.clipboard.writeText(textToCopy);
    addToast('success', 'Note copied to clipboard!');
  };

  // Export Notes
  const handleExportNotes = () => {
    localNotesStorage.exportNotesJson();
    addToast('info', 'Notes downloaded as JSON backup');
  };

  // Note Color Styles Helper
  const getNoteColorClasses = (color?: NoteColor, isPinned?: boolean) => {
    switch (color) {
      case 'amber':
        return 'bg-amber-50/80 dark:bg-amber-950/25 border-amber-300/80 dark:border-amber-700/60';
      case 'blue':
        return 'bg-sky-50/80 dark:bg-sky-950/25 border-sky-300/80 dark:border-sky-700/60';
      case 'emerald':
        return 'bg-emerald-50/80 dark:bg-emerald-950/25 border-emerald-300/80 dark:border-emerald-700/60';
      case 'purple':
        return 'bg-purple-50/80 dark:bg-purple-950/25 border-purple-300/80 dark:border-purple-700/60';
      case 'rose':
        return 'bg-rose-50/80 dark:bg-rose-950/25 border-rose-300/80 dark:border-rose-700/60';
      case 'default':
      default:
        return isPinned
          ? 'bg-amber-50/30 dark:bg-amber-950/15 border-amber-300 dark:border-amber-700/70'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700';
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Toast System */}
      <ToastNotification toasts={toasts} onDismiss={removeToast} />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        isOpen={deleteModal.isOpen}
        title={deleteModal.note?.title || ''}
        isPermanent={deleteModal.isPermanent}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, note: null, isPermanent: false })}
      />

      {/* Application Navigation Header */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#090d16]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 sm:gap-4">
          {/* Logo / Title */}
          <div
            onClick={() => {
              setView('list');
              setEditingNote(null);
            }}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                QuickNote
              </h1>
            </div>
          </div>

          {/* Right Header Toolbar */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Export Backup Button */}
            <button
              type="button"
              onClick={handleExportNotes}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              title="Download Notes Backup (JSON)"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Dark / Light Mode Switcher */}
            <ThemeToggle />

            {/* Prominent Create Note Button */}
            {view === 'list' && (
              <button
                type="button"
                onClick={handleOpenCreateForm}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Note</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Page Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {view === 'form' ? (
          /* Dedicated Form Screen for Creating or Editing */
          <NoteForm
            initialNote={editingNote}
            onSave={handleSaveNote}
            onCancel={() => {
              setView('list');
              setEditingNote(null);
            }}
            onDelete={(n) => handleDeleteClick(null, n)}
          />
        ) : (
          /* Dashboard Notes Screen */
          <div className="space-y-6">
            {/* Search and Quick Filters Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title or text..."
                  className="w-full pl-10 pr-9 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* View options: Sort and Grid/List toggle */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                {/* Sort selector */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-400">
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="bg-transparent border-none focus:outline-none cursor-pointer text-xs"
                  >
                    <option value="updated_at" className="dark:bg-slate-900">Recently Updated</option>
                    <option value="created_at" className="dark:bg-slate-900">Newest Created</option>
                    <option value="title" className="dark:bg-slate-900">Title (A-Z)</option>
                  </select>
                </div>

                {/* Grid / List View Toggle */}
                <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-0.5">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                    }`}
                    title="Grid Cards View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg transition-colors ${
                      viewMode === 'list'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                    }`}
                    title="Compact List View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-3">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentFilter('all');
                    setSelectedTag(null);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    currentFilter === 'all' && !selectedTag
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>All Notes</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/10">
                    {counts.all}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentFilter('pinned');
                    setSelectedTag(null);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    currentFilter === 'pinned' && !selectedTag
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Pin className="w-3.5 h-3.5" />
                  <span>Pinned</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/10">
                    {counts.pinned}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentFilter('favorites');
                    setSelectedTag(null);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    currentFilter === 'favorites' && !selectedTag
                      ? 'bg-amber-400 text-slate-900 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Star className="w-3.5 h-3.5" />
                  <span>Favorites</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/10">
                    {counts.favorites}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentFilter('trash');
                    setSelectedTag(null);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    currentFilter === 'trash' && !selectedTag
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Trash</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/10">
                    {counts.trash}
                  </span>
                </button>
              </div>

              {/* Trash Action Button */}
              {currentFilter === 'trash' && counts.trash > 0 && (
                <button
                  type="button"
                  onClick={handleEmptyTrash}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Empty Trash</span>
                </button>
              )}
            </div>

            {/* Tags Pills Bar */}
            {allTags.length > 0 && currentFilter !== 'trash' && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-slate-400 mr-1 flex items-center gap-1">
                  <Tag className="w-3 h-3" /> Tags:
                </span>
                {allTags.map((tag) => {
                  const isSelected = selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSelectedTag(isSelected ? null : tag)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      #{tag}
                    </button>
                  );
                })}
                {selectedTag && (
                  <button
                    type="button"
                    onClick={() => setSelectedTag(null)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 underline font-medium ml-1"
                  >
                    Clear tag
                  </button>
                )}
              </div>
            )}

            {/* Notes Rendering Area */}
            {filteredNotes.length === 0 ? (
              /* Empty State */
              <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 max-w-md mx-auto shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto mb-4">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
                  {searchQuery
                    ? `No notes matching "${searchQuery}"`
                    : currentFilter === 'trash'
                    ? 'Trash is empty'
                    : currentFilter === 'pinned'
                    ? 'No pinned notes'
                    : currentFilter === 'favorites'
                    ? 'No favorite notes'
                    : 'No notes yet'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-6">
                  {currentFilter === 'trash'
                    ? 'Deleted notes will appear here.'
                    : 'Click below to create your first note!'}
                </p>
                {currentFilter !== 'trash' && (
                  <button
                    type="button"
                    onClick={handleOpenCreateForm}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-600/25 active:scale-95 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Your First Note</span>
                  </button>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              /* Grid View: Responsive cards across PC & Mobile */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredNotes.map((note) => {
                  const isTrash = note.is_deleted;
                  const preview = note.content ? note.content.trim() : 'No content';
                  const colorClass = getNoteColorClasses(note.color, note.is_pinned);

                  return (
                    <div
                      key={note.id}
                      onClick={() => !isTrash && handleOpenEditForm(note)}
                      className={`group relative flex flex-col justify-between rounded-2xl border p-4 sm:p-5 transition-all shadow-xs hover:shadow-md ${colorClass} ${
                        !isTrash ? 'cursor-pointer hover:-translate-y-0.5' : ''
                      }`}
                    >
                      <div>
                        {/* Title and Badges */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-bold text-base text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {note.title || 'Untitled Note'}
                          </h4>

                          {!isTrash && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => handleTogglePin(e, note)}
                                className={`p-1 rounded-md transition-colors ${
                                  note.is_pinned
                                    ? 'text-amber-500'
                                    : 'text-slate-300 dark:text-slate-600 hover:text-slate-500'
                                }`}
                                title={note.is_pinned ? 'Unpin' : 'Pin to top'}
                              >
                                <Pin
                                  className={`w-3.5 h-3.5 ${note.is_pinned ? 'fill-current' : ''}`}
                                />
                              </button>

                              <button
                                type="button"
                                onClick={(e) => handleToggleFavorite(e, note)}
                                className={`p-1 rounded-md transition-colors ${
                                  note.is_favorite
                                    ? 'text-amber-400'
                                    : 'text-slate-300 dark:text-slate-600 hover:text-slate-500'
                                }`}
                                title={note.is_favorite ? 'Remove Favorite' : 'Add to Favorites'}
                              >
                                <Star
                                  className={`w-3.5 h-3.5 ${
                                    note.is_favorite ? 'fill-current' : ''
                                  }`}
                                />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Content Snippet */}
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-4 leading-relaxed mb-4 whitespace-pre-line">
                          {preview}
                        </p>
                      </div>

                      {/* Card Footer */}
                      <div>
                        {note.tags && note.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2.5">
                            {note.tags.map((t) => (
                              <span
                                key={t}
                                className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-black/5 dark:bg-white/10 text-slate-600 dark:text-slate-300"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/10 text-[11px] text-slate-400 dark:text-slate-400">
                          <span>
                            {new Date(note.updated_at || note.created_at).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>

                          <div className="flex items-center gap-1">
                            {!isTrash ? (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => handleCopyNote(e, note)}
                                  className="p-1 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md"
                                  title="Copy text"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEditForm(note);
                                  }}
                                  className="p-1 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md"
                                  title="Edit Note"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteClick(e, note)}
                                  className="p-1 hover:text-rose-600 dark:hover:text-rose-400 rounded-md"
                                  title="Move to Trash"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => handleRestoreNote(e, note)}
                                  className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold"
                                  title="Restore Note"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Restore</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteClick(e, note)}
                                  className="p-1 text-rose-500 hover:text-rose-700 ml-2"
                                  title="Delete Forever"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Compact List View: Great on PC and Mobile alike */
              <div className="space-y-2">
                {filteredNotes.map((note) => {
                  const isTrash = note.is_deleted;
                  const colorClass = getNoteColorClasses(note.color, note.is_pinned);

                  return (
                    <div
                      key={note.id}
                      onClick={() => !isTrash && handleOpenEditForm(note)}
                      className={`group flex items-center justify-between p-3.5 rounded-xl border transition-all shadow-xs ${colorClass} ${
                        !isTrash ? 'cursor-pointer hover:border-indigo-400' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {!isTrash && note.is_pinned && (
                          <Pin className="w-4 h-4 text-amber-500 fill-current shrink-0" />
                        )}
                        {!isTrash && note.is_favorite && (
                          <Star className="w-4 h-4 text-amber-400 fill-current shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                            {note.title || 'Untitled Note'}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {note.content || 'No content'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 text-xs text-slate-400 pl-3">
                        <span className="hidden sm:inline">
                          {new Date(note.updated_at).toLocaleDateString()}
                        </span>

                        <div className="flex items-center gap-1">
                          {!isTrash ? (
                            <>
                              <button
                                type="button"
                                onClick={(e) => handleCopyNote(e, note)}
                                className="p-1.5 hover:text-indigo-600 dark:hover:text-indigo-400"
                                title="Copy"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditForm(note);
                                }}
                                className="p-1.5 hover:text-indigo-600 dark:hover:text-indigo-400"
                                title="Edit"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteClick(e, note)}
                                className="p-1.5 hover:text-rose-600 dark:hover:text-rose-400"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={(e) => handleRestoreNote(e, note)}
                                className="px-2 py-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1"
                              >
                                <RotateCcw className="w-3.5 h-3.5" /> Restore
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteClick(e, note)}
                                className="p-1.5 text-rose-500 hover:text-rose-700"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Mobile Floating Action Button */}
      {view === 'list' && (
        <button
          type="button"
          onClick={handleOpenCreateForm}
          className="sm:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white shadow-xl flex items-center justify-center transition-all z-20 cursor-pointer"
          aria-label="Add Note"
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </button>
      )}
    </div>
  );
};

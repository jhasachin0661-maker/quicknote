'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Pin,
  Star,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import { Note, SaveStatus } from '../types/note';
import { TagManager } from './TagManager';

interface NoteEditorProps {
  note: Note | null;
  saveStatus: SaveStatus;
  errorMessage?: string;
  onSave: (noteData: { title: string; content: string; tags: string[]; is_pinned: boolean; is_favorite: boolean }) => void;
  onRetrySave: () => void;
  onDelete: (note: Note) => void;
  onRestore?: (note: Note) => void;
  onTogglePin: (isPinned: boolean) => void;
  onToggleFavorite: (isFavorite: boolean) => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  saveStatus,
  errorMessage,
  onSave,
  onRetrySave,
  onDelete,
  onRestore,
  onTogglePin,
  onToggleFavorite,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isPinned, setIsPinned] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);
  const currentNoteIdRef = useRef<string | null>(null);

  // Sync internal form state whenever selected note changes
  useEffect(() => {
    if (note) {
      currentNoteIdRef.current = note.id;
      setTitle(note.title);
      setContent(note.content);
      setTags(note.tags || []);
      setIsPinned(note.is_pinned);
      setIsFavorite(note.is_favorite);
      isInitialMount.current = true;
    } else {
      currentNoteIdRef.current = null;
      setTitle('');
      setContent('');
      setTags([]);
      setIsPinned(false);
      setIsFavorite(false);
    }
  }, [note?.id]);

  // Debounced autosave trigger
  const triggerAutoSave = useCallback(
    (newTitle: string, newContent: string, newTags: string[], newPinned: boolean, newFavorite: boolean) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        onSave({
          title: newTitle,
          content: newContent,
          tags: newTags,
          is_pinned: newPinned,
          is_favorite: newFavorite,
        });
      }, 700); // 700ms debounce interval
    },
    [onSave]
  );

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    triggerAutoSave(newTitle, content, tags, isPinned, isFavorite);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    triggerAutoSave(title, newContent, tags, isPinned, isFavorite);
  };

  const handleTagsChange = (newTags: string[]) => {
    setTags(newTags);
    triggerAutoSave(title, content, newTags, isPinned, isFavorite);
  };

  const handleTogglePin = () => {
    const nextPin = !isPinned;
    setIsPinned(nextPin);
    onTogglePin(nextPin);
  };

  const handleToggleFavorite = () => {
    const nextFav = !isFavorite;
    setIsFavorite(nextFav);
    onToggleFavorite(nextFav);
  };

  // Immediate save on Ctrl+S / Cmd+S
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      onSave({
        title,
        content,
        tags,
        is_pinned: isPinned,
        is_favorite: isFavorite,
      });
    }
  };

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center h-full p-8 text-center bg-slate-50/50 dark:bg-slate-950/30">
        <div className="max-w-sm text-slate-400 dark:text-slate-500">
          <p className="text-sm">Select a note from the list or create a new one to begin editing.</p>
        </div>
      </div>
    );
  }

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const isTrash = note.is_deleted;

  return (
    <div
      onKeyDown={handleKeyDown}
      className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 border-l border-slate-200/80 dark:border-slate-800 overflow-hidden"
    >
      {/* Top Banner if in Trash */}
      {isTrash && (
        <div className="bg-amber-50 dark:bg-amber-950/50 border-b border-amber-200/80 dark:border-amber-800/60 px-6 py-2.5 flex items-center justify-between text-xs text-amber-800 dark:text-amber-200">
          <span>This note is in the Trash. Restore it to resume editing.</span>
          {onRestore && (
            <button
              onClick={() => onRestore(note)}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restore Note
            </button>
          )}
        </div>
      )}

      {/* Editor Header Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/40">
        {/* Autosave Status Indicator */}
        <div className="flex items-center gap-2 text-xs">
          {saveStatus === 'saving' && (
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Saving...</span>
            </div>
          )}
          {saveStatus === 'saved' && (
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Saved</span>
            </div>
          )}
          {saveStatus === 'unsaved' && (
            <div className="flex items-center gap-1.5 text-slate-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>Unsaved changes</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Save failed</span>
              <button
                type="button"
                onClick={onRetrySave}
                className="inline-flex items-center gap-1 ml-1 text-xs text-rose-700 dark:text-rose-300 underline hover:no-underline font-semibold"
              >
                <RefreshCw className="w-3 h-3" /> Retry
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {!isTrash && (
            <>
              <button
                type="button"
                onClick={handleTogglePin}
                className={`p-2 rounded-lg transition-colors ${
                  isPinned
                    ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={isPinned ? 'Unpin note' : 'Pin note'}
              >
                <Pin className={`w-4 h-4 ${isPinned ? 'fill-current' : ''}`} />
              </button>

              <button
                type="button"
                onClick={handleToggleFavorite}
                className={`p-2 rounded-lg transition-colors ${
                  isFavorite
                    ? 'text-amber-400 bg-amber-50 dark:bg-amber-950/40'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => onDelete(note)}
            className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
            title={isTrash ? 'Permanently delete note' : 'Move to trash'}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-4">
        {/* Title Input */}
        <div>
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            disabled={isTrash}
            placeholder="Note title..."
            maxLength={200}
            className="w-full text-2xl font-bold text-slate-900 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-600 bg-transparent border-none outline-none focus:ring-0 px-0"
          />
        </div>

        {/* Tag Manager */}
        <div>
          <TagManager tags={tags} onChange={handleTagsChange} disabled={isTrash} />
        </div>

        {/* Content Textarea */}
        <div className="flex-1 flex flex-col pt-2">
          <textarea
            value={content}
            onChange={handleContentChange}
            disabled={isTrash}
            placeholder="Type your notes here... (Markdown supported)"
            className="flex-1 w-full resize-none text-sm leading-relaxed text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 bg-transparent border-none outline-none focus:ring-0 px-0"
          />
        </div>
      </div>

      {/* Editor Status Footer */}
      <div className="flex items-center justify-between px-6 py-2.5 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400 dark:text-slate-500 bg-slate-50/20 dark:bg-slate-900/20">
        <div className="flex items-center gap-4">
          <span>{wordCount} words</span>
          <span>{charCount} characters</span>
        </div>
        <div>
          <span>Last modified: {new Date(note.updated_at || note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
  );
};


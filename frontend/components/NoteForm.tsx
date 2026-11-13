'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Save,
  Pin,
  Star,
  Trash2,
  Tag,
  Check,
  X,
  Palette,
} from 'lucide-react';
import { Note, NoteColor } from '../types/note';

interface NoteFormProps {
  initialNote?: Note | null;
  onSave: (data: {
    title: string;
    content: string;
    tags: string[];
    color: NoteColor;
    is_pinned: boolean;
    is_favorite: boolean;
  }) => void;
  onCancel: () => void;
  onDelete?: (note: Note) => void;
}

const PRESET_TAGS = ['Personal', 'Work', 'Study', 'Ideas', 'Important', 'Todo'];

const COLOR_OPTIONS: { id: NoteColor; name: string; bgClass: string; borderClass: string }[] = [
  { id: 'default', name: 'Default', bgClass: 'bg-white dark:bg-slate-900', borderClass: 'border-slate-300 dark:border-slate-700' },
  { id: 'amber', name: 'Amber', bgClass: 'bg-amber-50/70 dark:bg-amber-950/40', borderClass: 'border-amber-300 dark:border-amber-700' },
  { id: 'blue', name: 'Blue', bgClass: 'bg-sky-50/70 dark:bg-sky-950/40', borderClass: 'border-sky-300 dark:border-sky-700' },
  { id: 'emerald', name: 'Emerald', bgClass: 'bg-emerald-50/70 dark:bg-emerald-950/40', borderClass: 'border-emerald-300 dark:border-emerald-700' },
  { id: 'purple', name: 'Purple', bgClass: 'bg-purple-50/70 dark:bg-purple-950/40', borderClass: 'border-purple-300 dark:border-purple-700' },
  { id: 'rose', name: 'Rose', bgClass: 'bg-rose-50/70 dark:bg-rose-950/40', borderClass: 'border-rose-300 dark:border-rose-700' },
];

export const NoteForm: React.FC<NoteFormProps> = ({
  initialNote,
  onSave,
  onCancel,
  onDelete,
}) => {
  const [title, setTitle] = useState(initialNote?.title || '');
  const [content, setContent] = useState(initialNote?.content || '');
  const [tags, setTags] = useState<string[]>(initialNote?.tags || []);
  const [color, setColor] = useState<NoteColor>(initialNote?.color || 'default');
  const [isPinned, setIsPinned] = useState(initialNote?.is_pinned || false);
  const [isFavorite, setIsFavorite] = useState(initialNote?.is_favorite || false);
  const [customTagInput, setCustomTagInput] = useState('');
  const [showCustomTagInput, setShowCustomTagInput] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(initialNote);

  const handleToggleTag = (tag: string) => {
    const normalized = tag.toLowerCase().trim();
    if (tags.includes(normalized)) {
      setTags(tags.filter((t) => t !== normalized));
    } else {
      setTags([...tags, normalized]);
    }
  };

  const handleAddCustomTag = () => {
    const trimmed = customTagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setCustomTagInput('');
      setShowCustomTagInput(false);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!title.trim() && !content.trim()) {
      setError('Please enter a title or write some note content before saving.');
      return;
    }

    setError(null);
    onSave({
      title: title.trim() || 'Untitled Note',
      content: content.trim(),
      tags,
      color,
      is_pinned: isPinned,
      is_favorite: isFavorite,
    });
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 py-4 md:py-6 animate-fade-in">
      {/* Sticky Top Action Bar */}
      <div className="sticky top-16 z-20 bg-slate-50/90 dark:bg-[#090d16]/90 backdrop-blur-md py-3 mb-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Notes</span>
        </button>

        <div className="flex items-center gap-2">
          {isEditing && onDelete && initialNote && (
            <button
              type="button"
              onClick={() => onDelete(initialNote)}
              className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
              title="Delete Note"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSubmit()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isEditing ? 'Save Changes' : 'Save Note'}</span>
          </button>
        </div>
      </div>

      {/* Error message banner */}
      {error && (
        <div className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Form Box */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-7 md:p-8 shadow-sm space-y-6">
        {/* Title Input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
            Note Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Enter title here..."
            className="w-full text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            autoFocus={!isEditing}
          />
        </div>

        {/* Options Row: Pin, Star, Color Theme */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1 border-y border-slate-100 dark:border-slate-800/80 py-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPinned(!isPinned)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                isPinned
                  ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
              }`}
            >
              <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-current' : ''}`} />
              <span>{isPinned ? 'Pinned to Top' : 'Pin Note'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFavorite(!isFavorite)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                isFavorite
                  ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
              <span>{isFavorite ? 'In Favorites' : 'Add to Favorites'}</span>
            </button>
          </div>

          {/* Color Picker */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Palette className="w-3.5 h-3.5" /> Color:
            </span>
            <div className="flex items-center gap-1.5">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id)}
                  title={c.name}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    c.id === 'default'
                      ? 'bg-slate-200 dark:bg-slate-700'
                      : c.id === 'amber'
                      ? 'bg-amber-400'
                      : c.id === 'blue'
                      ? 'bg-sky-400'
                      : c.id === 'emerald'
                      ? 'bg-emerald-400'
                      : c.id === 'purple'
                      ? 'bg-purple-400'
                      : 'bg-rose-400'
                  } ${
                    color === c.id
                      ? 'border-indigo-600 dark:border-indigo-400 scale-110 shadow-xs'
                      : 'border-transparent hover:scale-105'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Categories / Tags Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
            Category / Tags
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {PRESET_TAGS.map((tag) => {
              const active = tags.includes(tag.toLowerCase());
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleToggleTag(tag)}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    active
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {active && <Check className="w-3 h-3 stroke-[3]" />}
                  <span>#{tag}</span>
                </button>
              );
            })}

            {/* Custom tags */}
            {tags
              .filter((t) => !PRESET_TAGS.map((p) => p.toLowerCase()).includes(t))
              .map((customTag) => (
                <span
                  key={customTag}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-indigo-600 border border-indigo-600 text-white shadow-xs"
                >
                  <span>#{customTag}</span>
                  <button
                    type="button"
                    onClick={() => handleToggleTag(customTag)}
                    className="hover:opacity-80"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

            {showCustomTagInput ? (
              <div className="inline-flex items-center gap-1">
                <input
                  type="text"
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomTag();
                    } else if (e.key === 'Escape') {
                      setShowCustomTagInput(false);
                    }
                  }}
                  placeholder="tag name..."
                  className="w-24 px-2 py-1 text-xs rounded-lg border border-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAddCustomTag}
                  className="p-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomTagInput(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowCustomTagInput(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-400 transition-colors"
              >
                <Tag className="w-3 h-3" />
                <span>+ Custom Tag</span>
              </button>
            )}
          </div>
        </div>

        {/* Note Content Textarea with Natural Scrolling */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
            Note Content / Details
          </label>
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Enter your note details, ideas, thoughts, meeting items, or todo list here..."
            rows={14}
            className="w-full text-sm sm:text-base leading-relaxed text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-y min-h-[220px]"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-4">
            <span>{wordCount} words</span>
            <span>{charCount} characters</span>
            {initialNote?.updated_at && (
              <span>Last edited: {new Date(initialNote.updated_at).toLocaleDateString()}</span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSubmit()}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-600/25 active:scale-95 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Save Changes' : 'Save Note'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

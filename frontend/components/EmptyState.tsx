'use client';

import React from 'react';
import { FileText, Search, Star, Pin, Trash2, Plus, Tag } from 'lucide-react';

interface EmptyStateProps {
  type: 'all' | 'search' | 'pinned' | 'favorites' | 'trash' | 'tag';
  searchQuery?: string;
  activeTag?: string | null;
  onCreateNote?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  searchQuery,
  activeTag,
  onCreateNote,
}) => {
  const getDetails = () => {
    switch (type) {
      case 'search':
        return {
          icon: <Search className="w-10 h-10 text-slate-400" />,
          title: 'No matching notes',
          desc: searchQuery
            ? `We couldn't find any notes matching "${searchQuery}". Try different keywords or clear the search.`
            : 'No matching notes found.',
        };
      case 'pinned':
        return {
          icon: <Pin className="w-10 h-10 text-amber-400" />,
          title: 'No pinned notes',
          desc: 'Pin your most important notes to keep them anchored at the top of your list.',
        };
      case 'favorites':
        return {
          icon: <Star className="w-10 h-10 text-amber-400" />,
          title: 'No favorite notes',
          desc: 'Star your favorite notes to quickly access them in this dedicated view.',
        };
      case 'trash':
        return {
          icon: <Trash2 className="w-10 h-10 text-slate-400" />,
          title: 'Trash is empty',
          desc: 'Deleted notes will appear here. You can restore them anytime or permanently delete them.',
        };
      case 'tag':
        return {
          icon: <Tag className="w-10 h-10 text-indigo-400" />,
          title: `No notes with #${activeTag}`,
          desc: 'There are currently no active notes with this tag.',
        };
      case 'all':
      default:
        return {
          icon: <FileText className="w-10 h-10 text-indigo-400" />,
          title: 'No notes yet',
          desc: 'Your notebook is clean and ready. Click below to write your first thought or memo.',
          action: true,
        };
    }
  };

  const details = getDetails();

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center h-full min-h-[300px] animate-fade-in">
      <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 mb-4 border border-slate-200/50 dark:border-slate-800">
        {details.icon}
      </div>
      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">
        {details.title}
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed mb-4">
        {details.desc}
      </p>
      {details.action && onCreateNote && (
        <button
          type="button"
          onClick={onCreateNote}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Note
        </button>
      )}
    </div>
  );
};


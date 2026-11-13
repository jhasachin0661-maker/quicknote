'use client';

import React from 'react';
import {
  FileText,
  Pin,
  Star,
  Trash2,
  Plus,
  Tag,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';
import { FilterCategory } from '../types/note';
import { ThemeToggle } from './ThemeToggle';

interface SidebarProps {
  currentFilter: FilterCategory;
  selectedTag: string | null;
  counts: {
    all: number;
    pinned: number;
    favorites: number;
    trash: number;
  };
  tags: { name: string; count: number }[];
  isOnline: boolean;
  onSelectFilter: (category: FilterCategory) => void;
  onSelectTag: (tag: string | null) => void;
  onNewNote: () => void;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentFilter,
  selectedTag,
  counts,
  tags,
  isOnline,
  onSelectFilter,
  onSelectTag,
  onNewNote,
  onCloseMobile,
}) => {
  const navItems = [
    {
      id: 'all' as FilterCategory,
      label: 'All Notes',
      icon: <FileText className="w-4 h-4" />,
      count: counts.all,
    },
    {
      id: 'pinned' as FilterCategory,
      label: 'Pinned',
      icon: <Pin className="w-4 h-4" />,
      count: counts.pinned,
    },
    {
      id: 'favorites' as FilterCategory,
      label: 'Favorites',
      icon: <Star className="w-4 h-4" />,
      count: counts.favorites,
    },
    {
      id: 'trash' as FilterCategory,
      label: 'Trash',
      icon: <Trash2 className="w-4 h-4" />,
      count: counts.trash,
    },
  ];

  const handleNavClick = (cat: FilterCategory) => {
    onSelectTag(null);
    onSelectFilter(cat);
    if (onCloseMobile) onCloseMobile();
  };

  const handleTagClick = (tagName: string) => {
    if (selectedTag === tagName) {
      onSelectTag(null);
    } else {
      onSelectTag(tagName);
    }
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <aside className="w-64 h-full bg-slate-50/80 dark:bg-slate-950/80 border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between select-none">
      <div className="p-4 space-y-5 overflow-y-auto">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-sm shadow-indigo-500/30">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                QuickNote
              </h1>
              <p className="text-[10px] text-slate-400 font-medium">Single-Page Notes</p>
            </div>
          </div>
        </div>

        {/* Primary Action Button */}
        <div>
          <button
            type="button"
            onClick={() => {
              onNewNote();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-md shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Note</span>
          </button>
        </div>

        {/* Navigation Categories */}
        <div className="space-y-1">
          <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
            Library
          </p>
          {navItems.map((item) => {
            const isActive = currentFilter === item.id && !selectedTag;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold'
                      : 'bg-slate-200/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tags Section */}
        {tags.length > 0 && (
          <div className="space-y-1 pt-2">
            <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
              Tags
            </p>
            <div className="space-y-0.5">
              {tags.map((t) => {
                const isActive = selectedTag === t.name;
                return (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => handleTagClick(t.name)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">#{t.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{t.count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Bar: Local Storage Status and Theme */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between bg-slate-100/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 px-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Saved Locally</span>
        </div>
        <ThemeToggle />
      </div>
    </aside>
  );
};


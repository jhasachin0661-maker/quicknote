'use client';

import React from 'react';

export const NoteCardSkeleton: React.FC = () => {
  return (
    <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 animate-pulse space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
        <div className="h-3.5 w-3.5 bg-slate-200 dark:bg-slate-800 rounded-full" />
      </div>
      <div className="space-y-1.5">
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full" />
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-4/5" />
      </div>
      <div className="flex items-center justify-between pt-1">
        <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded w-20" />
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-full w-12" />
      </div>
    </div>
  );
};

export const NotesListSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <NoteCardSkeleton key={i} />
      ))}
    </div>
  );
};


'use client';

import { Undo2, Redo2 } from 'lucide-react';
import { useActionHistory } from '@/lib/actionHistory';

/** Persistent floating undo/redo control, rendered once in the CRM layout. */
export default function UndoRedoBar() {
  const { undo, redo, canUndo, canRedo, undoLabel, redoLabel, busy } = useActionHistory();

  return (
    <div className="fixed top-3 right-3 z-40 flex items-center gap-0.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-1">
      <button
        onClick={undo}
        disabled={!canUndo || busy}
        title={undoLabel ? `Anulează: ${undoLabel}` : 'Nimic de anulat'}
        aria-label="Anulează ultima acțiune"
        className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <Undo2 className="w-4 h-4" />
      </button>
      <div className="w-px h-5 bg-slate-200 dark:bg-slate-700" />
      <button
        onClick={redo}
        disabled={!canRedo || busy}
        title={redoLabel ? `Refă: ${redoLabel}` : 'Nimic de refăcut'}
        aria-label="Refă ultima acțiune anulată"
        className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <Redo2 className="w-4 h-4" />
      </button>
    </div>
  );
}

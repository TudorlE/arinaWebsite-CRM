'use client';

import { Undo2, Redo2 } from 'lucide-react';
import { useActionHistory } from '@/lib/actionHistory';

/** Persistent floating undo/redo control, rendered once in the CRM layout. */
export default function UndoRedoBar() {
  const { undo, redo, canUndo, canRedo, undoLabel, redoLabel, busy } = useActionHistory();

  return (
    <div className="fixed top-3 right-3 z-40 flex items-center gap-1 bg-white dark:bg-slate-900 backdrop-blur border-2 border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-1.5">
      <button
        onClick={undo}
        disabled={!canUndo || busy}
        title={undoLabel ? `Click pentru a merge înapoi: ${undoLabel}` : 'Nimic de anulat'}
        aria-label="Anulează ultima acțiune"
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-colors
          ${canUndo && !busy
            ? 'text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/30 hover:bg-brand-100 dark:hover:bg-brand-900/50'
            : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'}`}
      >
        <Undo2 className="w-5 h-5" />
        <span className="hidden sm:inline">Înapoi</span>
      </button>
      <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />
      <button
        onClick={redo}
        disabled={!canRedo || busy}
        title={redoLabel ? `Click pentru a merge înainte: ${redoLabel}` : 'Nimic de refăcut'}
        aria-label="Refă ultima acțiune anulată"
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-colors
          ${canRedo && !busy
            ? 'text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/30 hover:bg-brand-100 dark:hover:bg-brand-900/50'
            : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'}`}
      >
        <span className="hidden sm:inline">Înainte</span>
        <Redo2 className="w-5 h-5" />
      </button>
    </div>
  );
}

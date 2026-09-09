'use client';

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

export interface HistoryAction {
  label: string;
  undo: () => Promise<void> | void;
  redo: () => Promise<void> | void;
}

interface HistoryContextType {
  push: (action: HistoryAction) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  undoLabel: string | null;
  redoLabel: string | null;
  busy: boolean;
}

const HistoryContext = createContext<HistoryContextType | null>(null);

/**
 * Global undo/redo stack for CRM mutations. Pages call `push()` right after a
 * mutation succeeds, supplying the exact inverse (`undo`) and a way to
 * re-apply it (`redo`). A brand-new action clears the redo stack, matching
 * standard editor semantics.
 */
export function ActionHistoryProvider({ children }: { children: ReactNode }) {
  const undoStack = useRef<HistoryAction[]>([]);
  const redoStack = useRef<HistoryAction[]>([]);
  const [busy, setBusy] = useState(false);
  const [, setTick] = useState(0);
  const rerender = () => setTick(n => n + 1);

  const push = useCallback((action: HistoryAction) => {
    undoStack.current.push(action);
    redoStack.current = [];
    rerender();
  }, []);

  const undo = useCallback(() => {
    if (busy || undoStack.current.length === 0) return;
    const action = undoStack.current.pop()!;
    setBusy(true);
    Promise.resolve(action.undo())
      .then(() => { redoStack.current.push(action); })
      .catch(() => { undoStack.current.push(action); })
      .finally(() => { setBusy(false); rerender(); });
    rerender();
  }, [busy]);

  const redo = useCallback(() => {
    if (busy || redoStack.current.length === 0) return;
    const action = redoStack.current.pop()!;
    setBusy(true);
    Promise.resolve(action.redo())
      .then(() => { undoStack.current.push(action); })
      .catch(() => { redoStack.current.push(action); })
      .finally(() => { setBusy(false); rerender(); });
    rerender();
  }, [busy]);

  const value: HistoryContextType = {
    push, undo, redo,
    canUndo: undoStack.current.length > 0,
    canRedo: redoStack.current.length > 0,
    undoLabel: undoStack.current[undoStack.current.length - 1]?.label ?? null,
    redoLabel: redoStack.current[redoStack.current.length - 1]?.label ?? null,
    busy,
  };

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
}

/** Returns a no-op fallback outside the provider, so pages never need to guard against it. */
const noop: HistoryContextType = {
  push: () => {}, undo: () => {}, redo: () => {},
  canUndo: false, canRedo: false, undoLabel: null, redoLabel: null, busy: false,
};

export function useActionHistory(): HistoryContextType {
  return useContext(HistoryContext) ?? noop;
}

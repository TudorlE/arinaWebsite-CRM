'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number;
}

const icons = {
  success: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  error:   <AlertCircle  className="w-4 h-4 text-red-500" />,
  info:    <Info         className="w-4 h-4 text-blue-500" />,
};

export default function Toast({ message, type = 'info', onClose, duration = 3500 }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); setTimeout(onClose, 300); }, duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg
      bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
      text-sm text-slate-800 dark:text-slate-200
      transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
      {icons[type]}
      <span className="flex-1">{message}</span>
      <button onClick={() => { setVisible(false); setTimeout(onClose, 300); }} className="ml-1">
        <X className="w-3.5 h-3.5 text-slate-400" />
      </button>
    </div>
  );
}

// ─── Toast container (place once at the top level) ───────────────────────────

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onRemove: (id: number) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  const visible = toasts.slice(-3);
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full">
      {visible.map(t => (
        <Toast key={t.id} message={t.message} type={t.type} onClose={() => onRemove(t.id)} />
      ))}
    </div>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

let _id = 0;

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = (message: string, type: ToastType = 'info') => {
    const id = ++_id;
    setToasts(prev => {
      const next = [...prev, { id, message, type }];
      return next.length > 3 ? next.slice(next.length - 3) : next;
    });
  };

  const remove = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  return { toasts, toast, remove };
}

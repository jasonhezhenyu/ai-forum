'use client';

import { useEffect, useState, useCallback } from 'react';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

let toastId = 0;
const listeners: Set<(toasts: Toast[]) => void> = new Set();
let currentToasts: Toast[] = [];

function notifyListeners() {
  listeners.forEach((fn) => fn([...currentToasts]));
}

export function showToast(message: string, type: Toast['type'] = 'info') {
  const id = ++toastId;
  currentToasts = [...currentToasts, { id, message, type }];
  notifyListeners();
  setTimeout(() => {
    currentToasts = currentToasts.filter((t) => t.id !== id);
    notifyListeners();
  }, 3000);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    listeners.add(setToasts);
    return () => { listeners.delete(setToasts); };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-slide-in backdrop-blur-md ${
            toast.type === 'success'
              ? 'bg-green-600/95 text-white'
              : toast.type === 'error'
              ? 'bg-red-600/95 text-white'
              : 'bg-[var(--boe-dark)]/95 text-white'
          }`}
        >
          {toast.type === 'success' && '✅ '}
          {toast.type === 'error' && '❌ '}
          {toast.type === 'info' && '💡 '}
          {toast.message}
        </div>
      ))}
    </div>
  );
}

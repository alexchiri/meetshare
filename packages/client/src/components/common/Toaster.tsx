import { useState, useEffect, useCallback } from 'react';
import styles from './Toaster.module.css';

interface Toast {
  id: number;
  message: string;
  type: 'info' | 'error' | 'success';
}

let toastId = 0;
const listeners = new Set<(toast: Toast) => void>();

export function showToast(message: string, type: Toast['type'] = 'info') {
  const toast: Toast = { id: ++toastId, message, type };
  listeners.forEach((l) => l(toast));
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (toast: Toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 4000);
    };
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className={styles.container}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${styles.toast} ${styles[toast.type]}`}
          onClick={() => dismiss(toast.id)}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}

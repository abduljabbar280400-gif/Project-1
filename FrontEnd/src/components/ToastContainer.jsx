import React, { useState, useEffect } from 'react';
import { FiX, FiBell } from 'react-icons/fi';

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleAddToast = (e) => {
      const { id, title, body, requireInteraction } = e.detail;
      const toastId = id || Math.random().toString();
      const newToast = { id: toastId, title, body };

      setToasts(prev => {
        const filtered = prev.filter(t => t.id !== toastId);
        return [...filtered, newToast];
      });

      // Auto dismiss after 6 seconds unless it's a persistent alert
      if (!requireInteraction) {
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toastId));
        }, 6000);
      }
    };

    const handleCloseToast = (e) => {
      const { id } = e.detail;
      setToasts(prev => prev.filter(t => t.id !== id));
    };

    window.addEventListener('num_toast', handleAddToast);
    window.addEventListener('num_toast_close', handleCloseToast);

    return () => {
      window.removeEventListener('num_toast', handleAddToast);
      window.removeEventListener('num_toast_close', handleCloseToast);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2.5 max-w-sm w-[90%] pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="p-4 rounded-2xl border shadow-2xl flex gap-3 items-start relative overflow-hidden backdrop-blur-md pointer-events-auto transform transition-all duration-300"
          style={{
            backgroundColor: 'var(--bg-panel)',
            borderColor: 'var(--border)',
            color: 'var(--text-head)',
            borderLeft: '4px solid #B4846C',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center bg-[#FCDEC0] text-[#7D5A50] border border-[#B4846C]/20">
            <FiBell size={16} />
          </div>
          <div className="flex-1 pr-5">
            <h5 className="text-xs font-black leading-tight">{toast.title}</h5>
            {toast.body && <p className="text-[10px] font-semibold mt-0.5" style={{ color: 'var(--text-muted)' }}>{toast.body}</p>}
          </div>
          <button
            onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-slate-400 hover:text-slate-600"
          >
            <FiX size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

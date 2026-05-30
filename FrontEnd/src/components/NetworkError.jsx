import React from 'react';
import { FiWifiOff, FiRefreshCw } from 'react-icons/fi';

export default function NetworkError({ message = 'Connection failed. Please check your internet connection.', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-6 text-center card-solid mx-4 my-6">
      <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-4 border border-rose-100">
        <FiWifiOff size={28} />
      </div>
      <h3 className="text-base font-bold mb-1" style={{ color: 'var(--text-head)' }}>Network Connectivity Issue</h3>
      <p className="text-sm max-w-xs mb-6 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{message}</p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-secondary w-auto px-6 py-3 flex items-center gap-2"
        >
          <FiRefreshCw size={16} className="animate-spin" style={{ animationDuration: '3s' }} />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
}

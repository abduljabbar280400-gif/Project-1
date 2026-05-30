import React from 'react';

export default function LoadingSpinner({ message = 'Loading details...', size = 'md', color = 'amber' }) {
  if (size === 'sm') {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="relative w-5 h-5 flex-shrink-0">
          <div className="absolute inset-0 rounded-full" 
               style={{ border: '2px solid', borderColor: color === 'white' ? 'rgba(255,255,255,0.3)' : 'var(--border)' }}>
          </div>
          <div className="absolute inset-0 rounded-full animate-spin" 
               style={{ border: '2px solid transparent', borderTopColor: color === 'white' ? '#fff' : '#B4846C' }}>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full" style={{ border: '3px solid var(--border)' }}></div>
        <div className="absolute inset-0 rounded-full animate-spin" style={{ border: '3px solid transparent', borderTopColor: '#B4846C' }}></div>
      </div>
      {message && (
        <p className="mt-4 text-sm font-medium font-sans animate-pulse" style={{ color: 'var(--text-muted)' }}>{message}</p>
      )}
    </div>
  );
}

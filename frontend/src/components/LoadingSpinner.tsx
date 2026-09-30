import React from 'react';

export const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading pipeline data...' }) => (
  <div className="flex flex-col items-center justify-center py-16 space-y-3">
    <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
    <p className="text-xs font-medium text-muted animate-pulse">{message}</p>
  </div>
);

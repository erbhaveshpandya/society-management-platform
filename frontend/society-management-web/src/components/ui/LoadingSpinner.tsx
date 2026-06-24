import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex h-64 items-center justify-center bg-transparent">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
    </div>
  );
};

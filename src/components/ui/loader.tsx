import React from 'react';
import { cn } from '../../lib/utils';

interface LoaderProps {
  className?: string;
}

export function Loader({ className }: LoaderProps) {
  return (
    <div className={cn(
      'flex items-center justify-center min-h-screen bg-gray-100',
      className
    )}>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
    </div>
  );
}
import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-10 mt-20">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-muted-foreground mt-4 font-medium animate-pulse">Loading data...</p>
    </div>
  );
}

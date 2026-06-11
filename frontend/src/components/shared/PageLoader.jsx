import React from 'react';
import { Loader2 } from 'lucide-react';

export default function PageLoader({ text = "Loading..." }) {
  return (
    <div className="flex min-h-[50vh] w-full flex-col items-center justify-center p-8">
      <Loader2 className="h-10 w-10 animate-spin text-[var(--brand)]" />
      {text && <p className="mt-4 text-sm font-medium text-[var(--text-secondary)]">{text}</p>}
    </div>
  );
}

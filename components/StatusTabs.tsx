'use client';

import React, { useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export function StatusTabs({ 
  options, 
  filterParam = "status",
  defaultFilter = "active",
}: { 
  options: { value: string, label: string }[],
  filterParam?: string,
  defaultFilter?: string,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentVal = searchParams.get(filterParam) || defaultFilter;

  const handleStatus = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val && val !== defaultFilter) {
      params.set(filterParam, val);
    } else {
      params.delete(filterParam);
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      {options.map((opt) => {
        const isActive = currentVal === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => handleStatus(opt.value)}
            disabled={isPending}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all shadow-sm ${
              isActive
                ? 'bg-primary text-white border border-primary'
                : 'bg-white text-slate-600 border border-slate-200/60 hover:border-primary/50 hover:text-primary'
            } ${isPending ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function LangSwitcher({ lang }: { lang: string }) {
  const router = useRouter();

  const switchLang = (newLang: string) => {
    document.cookie = `lang=${newLang}; path=/; max-age=31536000`;
    router.refresh();
  };

  return (
    <div className="flex bg-slate-800 rounded-lg p-1 text-xs font-medium w-full">
      <button 
        className={`flex-1 py-1.5 rounded-md transition ${lang === 'ru' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}
        onClick={() => switchLang('ru')}
      >
        Рус
      </button>
      <button 
        className={`flex-1 py-1.5 rounded-md transition ${lang === 'uz' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}
        onClick={() => switchLang('uz')}
      >
        O'z
      </button>
    </div>
  );
}

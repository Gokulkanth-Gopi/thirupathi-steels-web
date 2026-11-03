import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Construction } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[#F4F5F7]">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-steel-200 text-center shadow-lg space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-100 shadow-sm">
          <Construction className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            404 Error
          </span>
          <h1 className="text-2xl font-extrabold text-[#111827]">Page Not Found</h1>
          <p className="text-xs text-steel-500 leading-relaxed">
            The rebar specifications or yard portal section you requested could not be located.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0c4a3b] text-white text-xs font-bold hover:bg-[#073328] transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Homepage</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

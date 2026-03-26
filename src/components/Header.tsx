'use client';

import Link from 'next/link';
import { SyncIndicator } from './SyncIndicator';

interface HeaderProps {
  title?: string;
  backHref?: string;
  actions?: React.ReactNode;
}

export function Header({ title = 'BRPD Inspector', backHref, actions }: HeaderProps) {
  return (
    <header className="bg-navy text-white sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          {backHref && (
            <Link
              href={backHref}
              className="tap-target flex items-center justify-center text-white/80 hover:text-white -ml-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
          )}
          <div className="min-w-0">
            <h1 className="text-lg font-semibold truncate">{title}</h1>
            <p className="text-xs text-white/60">Isles Safety Ltd</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SyncIndicator />
          {actions}
        </div>
      </div>
      <div className="h-1 bg-orange" />
    </header>
  );
}

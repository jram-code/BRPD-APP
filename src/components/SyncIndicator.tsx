'use client';

import { useState, useEffect } from 'react';
import { startAutoSync, isOnline, syncAll } from '@/lib/sync';
import { isSupabaseConfigured } from '@/lib/supabase';

export function SyncIndicator() {
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    setOnline(isOnline());
    setConfigured(isSupabaseConfigured());

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const cleanup = startAutoSync(30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      cleanup();
    };
  }, []);

  const handleManualSync = async () => {
    setSyncing(true);
    await syncAll();
    setSyncing(false);
  };

  if (!configured) return null;

  return (
    <button
      onClick={handleManualSync}
      className="tap-target flex items-center gap-1.5 px-2 py-1 rounded text-xs"
      title={online ? 'Online — tap to sync' : 'Offline — changes will sync when online'}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          syncing ? 'bg-yellow-400 animate-pulse' : online ? 'bg-green-400' : 'bg-red-400'
        }`}
      />
      <span className="text-white/70">
        {syncing ? 'Syncing...' : online ? 'Online' : 'Offline'}
      </span>
    </button>
  );
}

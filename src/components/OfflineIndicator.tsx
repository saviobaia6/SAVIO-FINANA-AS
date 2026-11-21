import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [justReconnected, setJustReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      setJustReconnected(false);
    } else if (wasOffline) {
      setJustReconnected(true);
      const timer = setTimeout(() => {
        setJustReconnected(false);
        setWasOffline(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (isOnline && !justReconnected) return null;

  if (!isOnline) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-[calc(76px+env(safe-area-inset-bottom))] md:bottom-4 left-4 right-4 md:right-auto z-40 flex items-center gap-2.5 rounded-xl bg-amber-600 text-white px-3.5 py-2.5 text-xs font-bold shadow-lg"
      >
        <WifiOff size={16} className="shrink-0" />
        <span>Modo Offline — Lançamentos e dados locais continuam disponíveis no dispositivo.</span>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-[calc(76px+env(safe-area-inset-bottom))] md:bottom-4 left-4 z-40 flex items-center gap-2 rounded-xl bg-emerald-600 text-white px-3.5 py-2 text-xs font-bold shadow-lg"
    >
      <Wifi size={15} className="shrink-0" />
      <span>Conexão restabelecida.</span>
    </div>
  );
};

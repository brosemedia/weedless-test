import { PropsWithChildren } from 'react';
import { useApp } from '../store/app';
import { useSyncData } from '../hooks/useSyncData';

export function HydrationGate({ children }: PropsWithChildren) {
  const hydrated = useApp((s) => s.hydrated);
  
  // Load sync data when hydrated and user is logged in
  useSyncData();
  
  if (!hydrated) return null;
  return children as any;
}

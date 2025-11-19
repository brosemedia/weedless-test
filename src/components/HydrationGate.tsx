import { PropsWithChildren } from 'react';
import { useApp } from '../store/app';

export function HydrationGate({ children }: PropsWithChildren) {
  const hydrated = useApp((s) => s.hydrated);
  if (!hydrated) return null;
  return children as any;
}

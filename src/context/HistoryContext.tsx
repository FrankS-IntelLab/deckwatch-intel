import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export interface HistoryEntry {
  id: string;
  source: 'chat' | 'report' | 'popup';
  label: string; // e.g. repo name, "AI Chat", "Report - Reddit"
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
  timestamp: number;
}

interface HistoryCtx {
  entries: HistoryEntry[];
  addEntry: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void;
}

const Ctx = createContext<HistoryCtx>({ entries: [], addEntry: () => {} });

function loadHistory(): HistoryEntry[] {
  try { return JSON.parse(localStorage.getItem('dw_history') || '[]'); }
  catch { return []; }
}

function saveHistory(entries: HistoryEntry[]) {
  localStorage.setItem('dw_history', JSON.stringify(entries.slice(-200))); // keep last 200
}

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<HistoryEntry[]>(loadHistory);

  const addEntry = useCallback((entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => {
    setEntries(prev => {
      const next = [...prev, { ...entry, id: crypto.randomUUID(), timestamp: Date.now() }];
      saveHistory(next);
      return next;
    });
  }, []);

  return <Ctx.Provider value={{ entries, addEntry }}>{children}</Ctx.Provider>;
}

export function useHistory() { return useContext(Ctx); }

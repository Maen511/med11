import { useMemo } from 'react';

/** Parse `{ id: number }[]` from localStorage once per key bump — avoids N×parse in list renders. */
export function useLocalStorageIdSet(storageKey: string, version: number): Set<number> {
  return useMemo(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return new Set<number>();
      const arr = JSON.parse(raw) as { id: number }[];
      if (!Array.isArray(arr)) return new Set<number>();
      return new Set(arr.map((r) => r.id));
    } catch {
      return new Set<number>();
    }
  }, [storageKey, version]);
}

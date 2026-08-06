import { useCallback, useEffect, useState } from 'react';
import { MMKV } from 'react-native-mmkv';

// MMKV-backed replacement for the web app's localStorage store. Same key namespace
// ('studyos:') and the same getStore/setStore/useStore API, so the ported pure-logic
// modules (progress, clouddb, cloudsync, plans, odin, …) work unchanged.
const storage = new MMKV({ id: 'lodestar' });
const NS = 'studyos:';

type Listener = (key: string) => void;
const listeners = new Set<Listener>();
const emit = (key: string) => listeners.forEach((l) => l(key));
export function subscribe(l: Listener) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function getStore<T = any>(key: string, fallback: T): T {
  try {
    const v = storage.getString(NS + key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function setStore(key: string, val: any) {
  try {
    storage.set(NS + key, JSON.stringify(val));
    emit(key);
  } catch {
    // ignore
  }
}

export function allStoreKeys(): string[] {
  return storage
    .getAllKeys()
    .filter((k) => k.indexOf(NS) === 0)
    .map((k) => k.slice(NS.length));
}

export function useStore<T = any>(
  key: string,
  fallback: T,
): [T, (next: T | ((cur: T) => T)) => void] {
  const [val, setVal] = useState<T>(() => getStore(key, fallback));
  useEffect(() => {
    const unsub = subscribe((k) => {
      if (k === key) setVal(getStore(key, fallback));
    });
    return () => {
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const set = useCallback(
    (next: T | ((cur: T) => T)) => {
      const cur = getStore(key, fallback);
      const v = typeof next === 'function' ? (next as (c: T) => T)(cur) : next;
      setStore(key, v);
      setVal(v);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );
  return [val, set];
}

export const uid = () =>
  String(Date.now()) + Math.random().toString(16).slice(2);
export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

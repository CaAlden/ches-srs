import {getOrElse} from 'fp-ts/lib/Either';
import {pipe} from 'fp-ts/lib/function';
import * as t from 'io-ts';
import { useState, useEffect, useCallback } from 'react';
import {useIsMounted} from '../utils';

export const useLocalStorage = (): Storage => {
  if ('localStorage' in window) {
    return window.localStorage;
  } else {
    throw new Error('Local Storage seems not to be supported');
  }
};

export function useStorageSelector<T>(f: (ctx: Storage) => T, depKeys?: string[]) {
  const isMounted = useIsMounted();
  const storage = useLocalStorage();
  const [state, setState] = useState(f(storage));

  // Cause rerenders when the storage changes;
  useEffect(() => {
    const storageListener = (e: StorageEvent) => {
      if ((!depKeys || (e.key && depKeys.includes(e.key))) && isMounted.current) {
        console.log(`Updating ${e.key}`);
        setState(f(storage));
      }
    };
    addEventListener('storage', storageListener);
    return () => {
      removeEventListener('storage', storageListener);
    };
  }, [f, depKeys, storage]);

  return state;
}

export const useStoreValue = (key: string) => {
  const storage = useLocalStorage();
  const value = useStorageSelector((s) => {
    return s.getItem(key);
  });
  const updateStoredValue = useCallback((value: string) => {
    storage.setItem(key, value);
  }, [key, storage]);

  const clearStoredValue = useCallback(() => {
    storage.removeItem(key);
  }, [key, storage]);

  return {
    value,
    setValue: updateStoredValue,
    remove: clearStoredValue,
  };
};

export function createStoredTypeHook<T>(codec: t.Type<T, string, unknown>) {
  return (key: string) => {
    const {
      value,
      setValue,
      remove,
    } = useStoreValue(key);
    return {
      value: pipe(codec.decode(value), getOrElse((): T | null => null)),
      setValue: (t: T) => setValue(codec.encode(t)),
      remove,
    };
  };
}

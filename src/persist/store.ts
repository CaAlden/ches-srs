import {getOrElse} from 'fp-ts/lib/Either';
import {pipe} from 'fp-ts/lib/function';
import * as t from 'io-ts';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {useIsMounted} from '../utils';

interface ISelectorContext {
  getItem: (key: string) => string | null;
};

export function useStorageSelector<T>(f: (ctx: ISelectorContext) => T, depKeys?: string[]) {
  const isMounted = useIsMounted();
  const [state, setState] = useState(f({ getItem: localStorage.getItem }));

  // Cause rerenders when the storage changes;
  useEffect(() => {
    const storageListener = (e: StorageEvent) => {
      if ((!depKeys || (e.key && depKeys.includes(e.key))) && isMounted.current) {
        setState(f({ getItem: localStorage.getItem }));
      }
    };
    addEventListener('storage', storageListener);
    return () => {
      removeEventListener('storage', storageListener);
    };
  });

  return state;
}

export const useStoreValue = (key: string) => {
  const value = useStorageSelector(({ getItem }) => getItem(key));
  const updateStoredValue = useCallback((value: string) => {
    localStorage.setItem(key, value);
  }, [key]);

  const clearStoredValue = useCallback(() => {
    localStorage.removeItem(key);
  }, [key]);

  return {
    value,
    setValue: updateStoredValue,
    remove: clearStoredValue,
  };
};

export function createStoredTypeHook<T>(codec: t.Type<T, string, string | null>) {
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

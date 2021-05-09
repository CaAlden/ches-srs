import { getOrElse } from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import * as t from 'io-ts';
import { useState, useEffect, useCallback, createContext, useContext, useMemo, useRef } from 'react';
import { Map, List } from 'immutable';
import { useIsMounted } from '../utils';

type Callback = () => void;

class Registry {
  private callbacks: Map<string, List<Callback>>;
  public constructor() {
    this.callbacks = Map();
  }

  public subscribe = (key: string, cbk: Callback): (() => void) => {
    const prev = this.callbacks.get(key) ?? List<Callback>();
    this.callbacks = this.callbacks.set(key, prev.push(cbk));
    return () => {
      // Getting it again to avoid setting a stale state later.
      const current = this.callbacks.get(key) ?? List<Callback>();
      this.callbacks.set(
        key,
        current.filter(c => cbk !== c),
      );
    };
  };

  public notify = (key: string) => {
    this.callbacks.get(key)?.forEach(cbk => cbk());
  };
}

const GlobalRegistryContext = createContext(new Registry());
export const useRegistryDirectlyInsteadOfUsingHelper = () => {
  return useContext(GlobalRegistryContext);
};

export const useLocalStorage = (): Storage => {
  if ('localStorage' in window) {
    return window.localStorage;
  } else {
    throw new Error('Local Storage seems not to be supported');
  }
};

export const useStoreValues = (keys: string[]) => {
  const isMounted = useIsMounted();
  const keyRef = useRef(keys);
  const storage = useLocalStorage();
  const [values, setValues] = useState(Map(keyRef.current.map((k): [string, string | null] => [k, storage.getItem(k)])));
  const registry = useRegistryDirectlyInsteadOfUsingHelper();
  useEffect(() => {
    const storageListener = (e: StorageEvent) => {
      if (e.key && keyRef.current.includes(e.key) && isMounted.current) {
        setValues(values.set(e.key, storage.getItem(e.key)));
        registry.notify(e.key);
      }
    };
    addEventListener('storage', storageListener);
    return () => {
      removeEventListener('storage', storageListener);
    };
  }, [storage, registry]);

  useEffect(() => {
    const unsubscribes = keyRef.current.map(key =>
      registry.subscribe(key, () => {
        if (isMounted.current) {
          setValues(values.set(key, storage.getItem(key)));
        }
      }),
    );
    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [storage, registry, keyRef.current]);

  const updateStoredValue = useCallback(
    (k: string, v: string) => {
      storage.setItem(k, v);
      registry.notify(k);
    },
    [storage, registry],
  );

  const clearStoredValue = useCallback(
    (k: string) => {
      storage.removeItem(k);
      registry.notify(k);
    },
    [registry, storage],
  );

  useEffect(() => {
    const currentMap = Map(keyRef.current.map(k => [k, k]));
    const keyMap = Map(keys.map(k => [k, k]));
    if (keys.some(k => currentMap.get(k) === undefined) || keyRef.current.some(k => keyMap.get(k) === undefined)) {
      keyRef.current = keys;
    }

  }, [keys]);

  useEffect(() => {
    setValues(Map(keyRef.current.map((k): [string, string | null] => [k, storage.getItem(k)])));
  }, [keyRef.current]);

  return {
    values,
    updateValue: updateStoredValue,
    remove: clearStoredValue,
  };
};

export const useStoreValue = (key: string) => {
  const keys = useMemo(() => [key], [key]);
  const { values, updateValue, remove } = useStoreValues(keys);

  const val = useMemo(() => values.get(key) ?? null, [values, key]);

  return {
    value: val,
    setValue: (value: string) => updateValue(key, value),
    remove: () => remove(key),
  };
};

export function createStoredTypeHook<T>(codec: t.Type<T, string, unknown>) {
  return (key: string, depKeys?: string[]) => {
    const registry = useRegistryDirectlyInsteadOfUsingHelper();
    const { value, setValue, remove } = useStoreValue(key);
    const decodedValue = useMemo(() => pipe(
      codec.decode(value),
      val => {
        return val;
      },
      getOrElse((): T | null => null),
    ), [value]);
    return {
      value: decodedValue,
      setValue: (t: T) => {
        setValue(codec.encode(t));
        depKeys?.forEach(k => registry.notify(k));
      },
      remove,
    };
  };
}

export function createManyStoredTypeHook<T>(codec: t.Type<T, string, unknown>) {
  return (keys: string[]) => {
    const { values, updateValue, remove } = useStoreValues(keys);
    const value = useMemo(() => {
      return values.map(
        v => pipe(
          codec.decode(v),
          getOrElse((): T | null => null),
        ),
      );
    }, [values])
    return {
      value,
      setValue: (key: string, t: T) => updateValue(key, codec.encode(t)),
      remove,
    };
  };
}

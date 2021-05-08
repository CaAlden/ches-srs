import { createStoredTypeHook, useLocalStorage, useStorageSelector } from './store';
import { ItemJsonCodec, jsonCodec, OpeningJsonCodec } from '../codecs';
import { Set as ImmutableSet } from 'immutable';
import * as t from 'io-ts';
import { pipe } from 'fp-ts/lib/function';
import { rights } from 'fp-ts/lib/Array';
import { getOrElse } from 'fp-ts/lib/Either';
import { IOpening } from '../types';

export const useOpening = createStoredTypeHook(OpeningJsonCodec);
export const useItem = createStoredTypeHook(ItemJsonCodec);

export const useItems = (itemIds: string[]) => {
  return useStorageSelector((storage) =>
    pipe(itemIds.map(storage.getItem), arr => arr.map(v => ItemJsonCodec.decode(v)), rights),
  );
};

const OPENING_REGISTRY_KEY = 'OPENINGS';
const openingIdsCodec = t.union([t.null, jsonCodec(t.array(t.string))]);
export const useOpeningControl = () => {
  const openings = useStorageSelector(
    (storage) =>
      pipe(
        storage.getItem(OPENING_REGISTRY_KEY),
        openingIdsCodec.decode,
        getOrElse((): string[] | null => []),
        idsOrNull => (idsOrNull === null ? [] : idsOrNull),
        arr => arr.map(v => OpeningJsonCodec.decode(v)),
        rights,
        vals => ImmutableSet(vals),
      ),
    [OPENING_REGISTRY_KEY],
  );

  const storage = useLocalStorage();

  return {
    openings,
    updateOpening: (opening: IOpening) => {
      storage.setItem(opening.id, OpeningJsonCodec.encode(opening));
      storage.setItem(OPENING_REGISTRY_KEY, JSON.stringify(openings.map(({ id }) => id).toArray()));
    },
    removeOpening: (opening: string | IOpening) => {
      const oId = typeof opening === 'string' ? opening : opening.id;
      storage.removeItem(oId);
      storage.setItem(
        OPENING_REGISTRY_KEY,
        JSON.stringify(
          openings
            .map(({ id }) => id)
            .filter(id => id !== oId)
            .toArray(),
        ),
      );
    },
  };
};

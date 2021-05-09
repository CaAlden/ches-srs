import { createManyStoredTypeHook, createStoredTypeHook, useLocalStorage, useRegistryDirectlyInsteadOfUsingHelper, useStoreValue } from './store';
import { ItemJsonCodec, jsonCodec, OpeningJsonCodec } from '../codecs';
import { Set as ImmutableSet } from 'immutable';
import * as t from 'io-ts';
import { pipe } from 'fp-ts/lib/function';
import { getOrElse } from 'fp-ts/lib/Either';
import { IItem, IOpening } from '../types';
import {useMemo} from 'react';

export const useOpening = createStoredTypeHook(OpeningJsonCodec);
export const useItem = createStoredTypeHook(ItemJsonCodec);
export const useOpenings = createManyStoredTypeHook(OpeningJsonCodec);
const useItemsInternal = createManyStoredTypeHook(ItemJsonCodec);

export const useItems = (keys: string[]) => {
  const { value } = useItemsInternal(keys);
  return useMemo(() => value.valueSeq().toArray().filter((x): x is IItem => x !== null), [value]);
};

const OPENING_REGISTRY_KEY = 'OPENINGS';
const openingIdsCodec = t.union([t.null, jsonCodec(t.array(t.string))]);

export const useOpeningsControl = () => {
  const storage = useLocalStorage();
  const registry = useRegistryDirectlyInsteadOfUsingHelper();
  const {
    value: openingIdsRaw,
    setValue: setOpeningIds,
  } = useStoreValue(OPENING_REGISTRY_KEY);
  const openingIds = useMemo(() => pipe(
    openingIdsRaw,
    openingIdsCodec.decode,
    getOrElse((): string[] | null => []),
    idsOrNull => (idsOrNull === null ? [] : idsOrNull),
    ids => ImmutableSet(ids),
  ), [openingIdsRaw]);

  const { value: openings, setValue: updateOpening, remove: removeOpening } = useOpenings(openingIds.toArray());

  return {
    openings: openings.filter((op): op is IOpening => op !== null).toList(),
    updateOpening: (opening: IOpening) => {
      setOpeningIds(JSON.stringify(openingIds.add(opening.id).toArray()));
      updateOpening(opening.id, opening);
    },
    removeOpening: (opening: IOpening) => {
      for (let itemId of opening.items) {
        storage.removeItem(itemId);
        // Have to manual notify here to correctly update items when doing this sort of cascaded delete.
        registry.notify(itemId);
      }
      removeOpening(opening.id);
      setOpeningIds(JSON.stringify(openingIds.filter(id => id !== opening.id).toArray()));
    },
  };
};

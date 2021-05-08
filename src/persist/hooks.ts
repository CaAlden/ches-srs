import { createStoredTypeHook, useStorageSelector } from './store';
import { ItemJsonCodec, OpeningJsonCodec } from '../codecs';
import {pipe} from 'fp-ts/lib/function';
import {rights} from 'fp-ts/lib/Array';

export const useOpening = createStoredTypeHook(OpeningJsonCodec);
export const useItem = createStoredTypeHook(ItemJsonCodec);

export const useItems = (itemIds: string[]) => {
  return useStorageSelector(({ getItem }) => pipe(
    itemIds.map(getItem),
    (arr) => arr.map(v => ItemJsonCodec.decode(v)),
    rights,
  ));
};

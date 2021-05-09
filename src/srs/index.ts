import {Chess, Move} from 'chess.js';
import {absurd} from 'fp-ts/lib/function';
import { v4 } from 'uuid';
import { IItem, IOpening } from '../types';
import { OrderedMap as ImmutableMap } from 'immutable';
import {MoveTree} from '../controller';

export enum Quality {
  Perfect = 5,
  CorrectHesitation = 4,
  CorrectDifficult = 3,
  IncorrectEasy = 2,
  Incorrect = 1,
  Blackout = 0,
}

export function calculateEFPrime(ef: number, quality: Quality): number {
  return Math.max(1.3, ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
}

const DAYS_2_MILLISECONDS = 1000 /* ms/s */ * 60 /* s/min */ * 60 /* min/hr */ * 24 /* hr/day */;

export const getInterval = (EF: number, previousInterval: number, quality: Quality): number => {
  switch(quality) {
    case Quality.Perfect:
    case Quality.CorrectHesitation:
    case Quality.CorrectDifficult: {
      // I(0) = 1 and I(1) = 4
      if (previousInterval === 1) {
        return 4;
      }
      return previousInterval * EF;
    }
    case Quality.IncorrectEasy:
    case Quality.Incorrect:
    case Quality.Blackout: {
      return 1;
    }
    default: {
      return absurd(quality);
    }
  }
};

export function updateItem(item: IItem, quality: Quality) {
  const efPrime = calculateEFPrime(item.EF, quality);
  const nextInterval = getInterval(efPrime, item.interval, quality);
  return {
    ...item,
    EF: efPrime,
    interval: nextInterval,
    nextReview: new Date(Date.now() + (nextInterval * DAYS_2_MILLISECONDS)),
  };
}

export function sameHistory(a: IItem, b: IItem) {
  return a.pgn === b.pgn;
}

type Game = Move[];
const flattenMoveTree = (branches: ImmutableMap<string, MoveTree>): Game[] => {
  return branches.toList().flatMap((tree): Game[] => {
    const subGames = flattenMoveTree(tree.branches);
    return subGames.length === 0 ? [tree.moves] : subGames.map((g): Game => [...tree.moves, ...g]);
  }).toArray();
}

export function generateItems(opening: IOpening): IItem[] {
  const chess = new Chess();
  const items: IItem[] = [];
  const games = flattenMoveTree(opening.moveTree);
  for (let game of games) {
    // Load the whole game into the Chess instance
    for (let m of game) {
      chess.move(m);
    }

    while(chess.history().length > 0) {
      if (chess.turn() !== opening.color) {
        const finalPosition = chess.fen();
        const currentHistory = chess.history();
        const nextMove = currentHistory[currentHistory.length - 1];
        chess.undo();
        const pgn = chess.pgn();
        const newItem: IItem = {
          id: v4(),
          EF: 2.5, 
          interval: 1,
          nextReview: null,
          pgn,
          comment: opening.comments.get(finalPosition) ?? '',
          finalPosition,
          nextMove,
        };

        // Avoid adding duplicate items since the tree was flattened out.
        if (items.find(i => sameHistory(i, newItem)) === undefined) {
          items.push(newItem);
        }

      } else {
        // Unplay the move (this will skip moves from the other color)
        chess.undo();
      }
    }
  }

  // Reverse items to hopefully put the earlier positions at the beginning.
  items.reverse();
  return items;
}

export function updateOpeningItems(storedItems: IItem[], update: IOpening) {
  const updateItems = generateItems(update);

  const finalItems: IItem[] = [];

  for (let uItem of updateItems) {
    const match = storedItems.find((i) => sameHistory(uItem, i));
    if (match) {
      if (match.finalPosition === uItem.finalPosition) {
        finalItems.push({
          ...match,
          // Overwriting comments is fine.
          comment: uItem.comment,
        });
      } else {
        // Otherwise keep the old id but use the new data.
        finalItems.push({ ...uItem, id: match.id });
      }
    } else {
      // New item
      finalItems.push(uItem);
    }
  }

  return finalItems;
}

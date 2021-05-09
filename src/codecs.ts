import { OrderedMap as ImmutableMap } from 'immutable';
import * as t from 'io-ts';
import { Chess, Move, Square } from 'chess.js';
import { MoveTree } from './controller';
import { pipe } from 'fp-ts/lib/function';
import * as E from 'fp-ts/lib/Either';
import { IItem, IOpening } from './types';

const DateCodec = new t.Type<Date>(
  'DateCodec',
  (x): x is Date => x instanceof Date,
  (i, c) => {
    if (typeof i === 'string') {
      const parsed = Date.parse(i);
      if (Number.isNaN(parsed)) {
        return t.failure(i, c, `Could not parse date from ${i}`);
      }
      return t.success(new Date(parsed));
    }
    return t.failure(i, c);
  },
  i => i,
);

export const jsonCodec = <T>(codec: t.Type<T>, toJSON: (t: T) => string = JSON.stringify): t.Type<T, string, unknown> => {
  return new t.Type(
    `JSON(${codec.name})`,
    codec.is,
    (i, c) => {
      let parsed: unknown = undefined;
      if (typeof i !== 'string') {
        return t.failure(i, c, `Expected a string but given ${i}`);
      }
      try {
        parsed = JSON.parse(i);
      } catch (e) {
        return t.failure(i, c, 'Could not parse JSON');
      }
      return codec.decode(parsed);
    },
    toJSON,
  );
};

export const isFen = (x: unknown): x is string => {
  const chess = new Chess();
  return typeof x === 'string' && chess.load(x);
};

export const isPgn = (x: unknown): x is string => {
  const chess = new Chess();
  return typeof x === 'string' && chess.load_pgn(x);
};

export const FENCodec: t.Type<string, string, string> = new t.Type(
  'FENCodec',
  isFen,
  (i, c) => {
    const chess = new Chess();
    if (chess.load(i)) {
      return t.success(chess.fen());
    } else {
      return t.failure(i, c, `Could not parse a FEN, given: ${i}`);
    }
  },
  i => i,
);

export const PGNCodec: t.Type<string, string, string> = new t.Type(
  'PGNCodec',
  isPgn,
  (i, c) => {
    const chess = new Chess();
    if (chess.load_pgn(i)) {
      return t.success(chess.pgn());
    } else {
      return t.failure(i, c, `Could not parse a PGN, given: ${i}`);
    }
  },
  i => i,
);

const isSquare = (x: unknown): x is Square => {
  return (
    typeof x === 'string' &&
    x.length === 2 &&
    ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].includes(x[0]) &&
    ['1', '2', '3', '4', '5', '6', '7', '8'].includes(x[1])
  );
};

const squareCodec: t.Type<Square, Square, unknown> = new t.Type(
  'SquareCodec',
  isSquare,
  (i, c) => {
    if (isSquare(i)) {
      return t.success(i);
    } else {
      return t.failure(i, c);
    }
  },
  i => i,
);

const moveCodec: t.Type<Move, Move, unknown> = t.type({
  color: t.keyof({ b: null, w: null }),
  flags: t.string,
  piece: t.keyof({
    p: null,
    r: null,
    q: null,
    b: null,
    k: null,
    n: null,
  }),
  san: t.string,
  to: squareCodec,
  from: squareCodec,
});

const immutableMap = <K extends string, V>(
  keyCodec: t.Type<K>,
  valueCodec: t.Type<V>,
): t.Type<ImmutableMap<K, V>, ImmutableMap<K, V>, unknown> => {
  return new t.Type(
    `immutable(${keyCodec.name}, ${valueCodec.name})`,
    (i: unknown): i is ImmutableMap<K, V> => {
      throw new Error('unimplemented');
    },
    (i, c) => {
      if (t.UnknownRecord.is(i)) {
        let map: ImmutableMap<K, V> = ImmutableMap();
        for (let [k, v] of Object.entries(i)) {
          pipe(
            keyCodec.decode(k),
            E.map(decodedKey => {
              pipe(
                valueCodec.decode(v),
                E.map(decodedValue => {
                  map = map.set(decodedKey, decodedValue);
                }),
              );
            }),
          );
        }
        return t.success(map);
      } else {
        return t.failure(i, c);
      }
    },
    e => e,
  );
};

const MoveTreeCodec: t.Type<MoveTree, MoveTree, unknown> = t.recursion('moveTree', self =>
  t.type({
    moves: t.array(moveCodec),
    sectionStart: t.number,
    branches: immutableMap(t.string, self),
  }),
);

export const MoveTreeJsonCodec: t.Type<MoveTree, string, unknown> = jsonCodec(
  MoveTreeCodec,
  tree =>
    JSON.stringify({
      ...tree,
      branches: tree.branches.toJS(),
    }),
);

const ItemCodec: t.Type<IItem> = t.type({
  id: t.string,
  EF: t.number,
  nextReview: DateCodec,
  pgn: t.string.pipe(PGNCodec),
  finalPosition: t.string.pipe(FENCodec),
  // This could potentially be made into a safer type (for example check that the move is legal).
  nextMove: t.string,
});

export const ItemJsonCodec: t.Type<IItem, string, unknown> = jsonCodec(ItemCodec, (t) => JSON.stringify({
  ...t,
  nextReview: t.nextReview.toISOString(),
}));

const OpeningCodec: t.Type<IOpening> = t.type({
  id: t.string,
  name: t.string,
  moveTree: immutableMap<string, MoveTree>(t.string, MoveTreeCodec),
  color: t.keyof({ b: null, w: null }),
  items: t.array(t.string),
});

const deeplyJS = (branches: ImmutableMap<string, MoveTree>): object => {
  return branches.map(tree => ({ ...tree, branches: deeplyJS(tree.branches) })).toJS();
};

export const OpeningJsonCodec: t.Type<IOpening, string, unknown> = new t.Type(
  'OpeningJson',
  (x): x is IOpening  => {
    throw new Error('unimplemented');
  },
  (i, c) => {
    if (typeof i === 'string') {
      try {
        const parsed = JSON.parse(i);
        return OpeningCodec.decode(parsed);
      } catch (e) {
        return t.failure(i, c, 'Invalid JSON');
      }
    }
    return t.failure(i, c, 'Not given a string');
  },
  i => JSON.stringify({
    ...i,
    moveTree: deeplyJS(i.moveTree),
  }),
);

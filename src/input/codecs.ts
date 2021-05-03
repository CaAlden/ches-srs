import * as t from 'io-ts';
import { Chess } from 'chess.js';

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

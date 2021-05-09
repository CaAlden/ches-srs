import {Chess, Move} from 'chess.js';
import {isLeft} from 'fp-ts/lib/Either';
import { PathReporter } from 'io-ts/lib/PathReporter';
import { OrderedMap as ImmutableMap } from 'immutable';
import {ItemJsonCodec, OpeningJsonCodec} from './codecs';
import {updateTree} from './controller';
import {IOpening} from "./types";

function getMoves(...args: string[]): Move[] {
  const chess = new Chess();
  for (let move of args) {
    chess.move(move);
  }

  return chess.history({ verbose: true });
}

describe('codecs', () => {
  describe('Item', () => {
    it('encodes an item to expected JSON', () => {
      expect(ItemJsonCodec.encode({
        id: 'testItemId',
        EF: 1,
        nextReview: new Date(0),
        pgn: '1. e4',
        finalPosition: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
        nextMove: 'e5',
      })).toEqual(
        JSON.stringify({
          id: 'testItemId',
          EF: 1,
          nextReview: new Date(0).toISOString(),
          pgn: '1. e4',
          finalPosition: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
          nextMove: 'e5',
        }),
      );
    });

    it('decodes an Item from expected JSON', () => {
      expect(ItemJsonCodec.decode(JSON.stringify({
        id: 'testItemId',
        EF: 1,
        nextReview: new Date(0),
        pgn: '1. e4',
        finalPosition: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
        nextMove: 'e5',
      }))).toEqual({
        _tag: 'Right',
        right: {
          id: 'testItemId',
          EF: 1,
          nextReview: new Date(0),
          pgn: '1. e4',
          finalPosition: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
          nextMove: 'e5',
        },
      });
    });
  });

  describe('Opening', () => {
    let opening: IOpening = {
      name: 'Test Opening',
      id: 'testId',
      items: [],
      moveTree: ImmutableMap(),
      color: 'w',
    };

    const doTests = (expectedJSON: string) => {
      it('encodes to expected JSON', () => {
        expect(OpeningJsonCodec.encode(opening)).toEqual(expectedJSON);
      });

      it('decodes expectedJSON', () => {
        const decoded = OpeningJsonCodec.decode(expectedJSON);
        if (isLeft(decoded)) {
          console.log(PathReporter.report(decoded).join('\n'));
        }
        expect(decoded).toEqual({
          _tag: 'Right',
          right: opening,
        });
      });
    };

    describe('with no move tree', () => {
      beforeEach(() => {
        opening.moveTree = ImmutableMap();
      });
      doTests(JSON.stringify({
        name: 'Test Opening',
        id: 'testId',
        items: [],
        moveTree: {},
        color: 'w',
      }));
    });

    describe('with shallow move tree', () => {
      beforeEach(() => {
        const chess = new Chess();
        chess.move('e4');
        chess.move('e5');
        chess.move('Nc3');
        opening.moveTree = ImmutableMap();
        opening.moveTree = updateTree(chess.history({ verbose: true }), opening.moveTree);
      });
      doTests(JSON.stringify({
        name: 'Test Opening',
        id: 'testId',
        items: [],
        moveTree: { e4: {
          moves: getMoves('e4', 'e5', 'Nc3'),
          sectionStart: 1,
          branches: {},
        }},
        color: 'w',
      }));
    });

    describe('with deep move tree', () => {
      beforeEach(() => {
        opening.moveTree = ImmutableMap();
        const chess = new Chess();
        chess.move('e4');
        chess.move('e5');
        chess.move('Nc3');
        opening.moveTree = ImmutableMap();
        opening.moveTree = updateTree(chess.history({ verbose: true }), opening.moveTree);
        chess.undo();
        chess.move('Nf3');
        chess.move('Nc6');
        opening.moveTree = updateTree(chess.history({ verbose: true }), opening.moveTree);
        chess.undo();
        chess.move('Nf6');
        opening.moveTree = updateTree(chess.history({ verbose: true }), opening.moveTree);
      });

      doTests(JSON.stringify({
        name: 'Test Opening',
        id: 'testId',
        items: [],
        moveTree: { e4: {
          moves: getMoves('e4', 'e5'),
          sectionStart: 1,
          branches: {
            Nc3: {
              moves: getMoves('e4', 'e5', 'Nc3').slice(2),
              sectionStart: 2,
              branches: {},
            },
            Nf3: {
              moves: getMoves('e4', 'e5', 'Nf3').slice(2),
              sectionStart: 2,
              branches: {
                Nc6: {
                  moves: getMoves('e4', 'e5', 'Nf3', 'Nc6').slice(3),
                  sectionStart: 2,
                  branches: {},
                },
                Nf6: {
                  moves: getMoves('e4', 'e5', 'Nf3', 'Nf6').slice(3),
                  sectionStart: 2,
                  branches: {},
                },
              },
            }
          },
        }},
        color: 'w',
      }))
    });
  });
})

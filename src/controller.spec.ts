import { updateTree, MoveTree } from './controller';
import { Chess } from 'chess.js';
import { OrderedMap as ImmutableMap } from 'immutable';

describe('updateTree', () => {
  it('updates a tree with a number of moves in a row', () => {
    const chess = new Chess();
    chess.move('e4');
    chess.move('e5');
    chess.move('Nf3');
    const history = chess.history({ verbose: true });
    const updatedMap = updateTree(history, ImmutableMap());

    expect(updatedMap.size).toBe(1);
    const actual = updatedMap.get('e4');
    expect(actual).not.toBeUndefined();
    expect(actual?.moves.length).toBe(history.length);
    for (let i = 0; i < history.length; i++) {
      expect(actual?.moves[i]).toBe(history[i]);
    }
    expect(actual?.sectionStart).toBe(1);
  });

  it('adds a single move to the end of a list of moves', () => {
    const chess = new Chess();
    chess.move('e4');
    const start = updateTree(chess.history({ verbose: true }), ImmutableMap());
    chess.move('e5');

    const history = chess.history({ verbose: true });
    const updatedMap = updateTree(history, start);

    expect(updatedMap.size).toBe(1);
    const actual = updatedMap.get('e4');
    expect(actual).not.toBeUndefined();
    expect(actual?.moves.length).toBe(history.length);
    for (let i = 0; i < history.length; i++) {
      expect(actual?.moves[i]).toBe(history[i]);
    }
    expect(actual?.sectionStart).toBe(1);
  });

  it('creates a new branch when given a new starting move', () => {
    const chess = new Chess();
    chess.move('e4');
    const start = updateTree(chess.history({ verbose: true }), ImmutableMap());
    chess.undo();
    chess.move('d4');
    const next = updateTree(chess.history({ verbose: true }), start);

    expect(next.size).toBe(2);
    const e4 = next.get('e4');
    expect(e4).not.toBeUndefined();
    expect(e4?.moves.map(({ san }) => san)).toEqual([
      'e4'
    ]);
    expect(e4?.sectionStart).toBe(1);
    expect(next.has('d4')).toBeTruthy();
  });

  it('creates a new branch part way through a list of moves in a tree', () => {
    const chess = new Chess();
    chess.move('e4');
    chess.move('e5');
    chess.move('Nf3');

    const start = updateTree(chess.history({ verbose: true }), ImmutableMap());
    chess.undo();
    chess.move('Nc3');
    const history = chess.history({ verbose: true });
    const next = updateTree(history, start);

    expect(next.size).toBe(1);
    const mainline = next.get('e4');
    expect(mainline).not.toBeUndefined();
    expect(mainline?.moves.length).toBe(2);
    for (let i = 0; i < 2; i++) {
      expect(mainline?.moves[i]).toBe(history[i]);
    }
    expect(mainline?.branches.size).toBe(2);
    expect(mainline?.branches.has('Nc3')).toBeTruthy();
    expect(mainline?.branches.has('Nf3')).toBeTruthy();

    const continuation: MoveTree | undefined = mainline?.branches.first();
    expect(continuation).not.toBeUndefined();
    expect(continuation?.moves.length).toBe(1);
    expect(continuation?.moves[0].san).toBe('Nf3');
    expect(continuation?.sectionStart).toBe(2);
  });

  it('returns exactly the same tree if the list of moves was already contained in the tree', () => {
    const chess = new Chess();
    chess.move('e4');
    chess.move('e5');
    chess.move('Nf3');
    const updatedMap = updateTree(chess.history({ verbose: true }), ImmutableMap());

    const emptyUpdate = updateTree([], updatedMap);
    chess.undo();
    const subsetUpdate = updateTree(chess.history({ verbose: true }), updatedMap);

    expect(emptyUpdate).toEqual(updatedMap);
    expect(subsetUpdate).toEqual(updatedMap);
  });

  it('branches in branches', () => {
    const chess = new Chess();
    chess.move('e4');
    chess.move('e5');
    chess.move('Nf3');
    chess.move('Nc6');

    const start = updateTree(chess.history({ verbose: true }), ImmutableMap());
    chess.undo();
    chess.move('d6');
    chess.move('Bc4');
    const intermediate = updateTree(chess.history({ verbose: true }), start);
    chess.undo();
    chess.move('d3');

    const final = updateTree(chess.history({ verbose: true }), intermediate);

    expect(final.size).toBe(1);
    const first = final.get('e4');
    expect(first).not.toBeUndefined();
    expect(first?.moves.map(({ san }) => san)).toEqual([
      'e4',
      'e5',
      'Nf3',
    ]);
    const branches = first?.branches;
    expect(branches?.size).toBe(2);
    const Nc6 = branches?.get('Nc6');
    const d6 = branches?.get('d6');
    expect(Nc6).not.toBeUndefined();
    expect(Nc6?.moves.map(({ san }) => san)).toEqual([
      'Nc6',
    ]);

    expect(d6).not.toBeUndefined();
    expect(d6?.moves.map(({ san }) => san)).toEqual([
      'd6',
    ]);
    expect(d6?.branches.size).toBe(2);
    const sub1 = d6?.branches.get('d3');
    const sub2 = d6?.branches.get('Bc4');

    expect(sub1).not.toBeUndefined();
    expect(sub2).not.toBeUndefined();
    expect(sub1?.sectionStart).toBe(3);

    expect(sub1?.moves.map(({ san }) => san)).toEqual([
      'd3',
    ]);
    expect(sub2?.moves.map(({ san }) => san)).toEqual([
      'Bc4',
    ]);
  });
});

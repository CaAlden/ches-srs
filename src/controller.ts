import React, {useContext, useEffect, useState} from 'react';
import { Api as ChessgroundApi } from 'chessground/api';
import { Chess, ChessInstance, Move, ShortMove } from 'chess.js';
import { Chessground } from 'chessground';
import { Key } from 'chessground/types';
import { OrderedMap as ImmutableMap, OrderedMap } from 'immutable';
import {Config} from 'chessground/config';

export interface MoveTree {
  moves: Move[];
  sectionStart: number;
  branches: ImmutableMap<string, MoveTree>;
}

/**
 * Helper for converting from chess.js moves to the key map used by
 * Chessground
 */
function toDests(chess: ChessInstance): Map<Key, Key[]> {
  const dests = new Map<Key, Key[]>();
  chess.SQUARES.forEach(s => {
    const ms = chess.moves({ square: s, verbose: true });
    if (ms.length)
      dests.set(
        s,
        ms.map(m => m.to),
      );
  });
  return dests;
}

function toTurn(t: 'b' | 'w'): 'black' | 'white' {
  return t === 'b' ? 'black' : 'white';
}

export function areMovesEqual(a: Move, b: Move) {
  return a.san === b.san;
}

/**
 * Helper for updating the branching tree of PGNs with a new history.
 */
export function updateTree(
  moves: Move[],
  tree: ImmutableMap<string, MoveTree>,
  depth: number = 1,
): ImmutableMap<string, MoveTree> {
  if (moves.length === 0) {
    return tree;
  }

  const activeBranch = tree.get(moves[0].san);
  if (activeBranch === undefined) {
    return tree.set(moves[0].san, {
      moves,
      sectionStart: Math.floor((depth + 1) / 2),
      branches: OrderedMap(),
    });
  }

  let i: number;
  for (i = 0; i < moves.length && i < activeBranch.moves.length; i++) {
    if (!areMovesEqual(activeBranch.moves[i], moves[i])) {
      const commonHistory = moves.slice(0, i);
      return tree.set(activeBranch.moves[0].san, {
        moves: commonHistory,
        sectionStart: Math.floor((depth + 1) / 2),
        // Split the two apart.
        branches: OrderedMap([
          [activeBranch.moves[i].san, {
            moves: activeBranch.moves.slice(i),
            sectionStart: Math.floor((depth + i + 1) / 2),
            branches: OrderedMap(),
          }],
          [moves[i].san, {
            moves: moves.slice(i),
            sectionStart: Math.floor((depth + i + 1) / 2),
            branches: OrderedMap(),
          }],
        ]),
      });
    }
  }

  if (moves.length > activeBranch.moves.length) {
    if (activeBranch.branches.has(moves[i].san)) {
      return tree.set(activeBranch.moves[0].san, {
        moves: activeBranch.moves,
        sectionStart: activeBranch.sectionStart,
        branches: updateTree(moves.slice(i), activeBranch.branches, depth + i),
      });
    } else if (activeBranch.branches.size === 0) {
      return tree.set(moves[0].san, {
        moves,
        sectionStart: activeBranch.sectionStart,
        branches: activeBranch.branches,
      });
    } else {
      return tree.set(moves[0].san, {
        moves: activeBranch.moves,
        sectionStart: activeBranch.sectionStart,
        branches: activeBranch.branches.set(moves[i].san, {
          moves: moves.slice(i),
          sectionStart: Math.floor((depth + i + 1) / 2),
          branches: OrderedMap(),
        }),
      });
    }
  }

  // Otherwise the moves were already full represented in the tree.
  return tree;
}

class Controller {
  private cg: ChessgroundApi | null;
  private chess: ChessInstance;
  private perspective: 'white' | 'black';

  private subscribed: Array<() => void>;
  private internalMoveTree: ImmutableMap<string, MoveTree>;

  public constructor(initialPerspective?: 'white' | 'black') {
    this.subscribed = [];
    this.cg = null;
    this.perspective = initialPerspective ?? 'white';
    this.chess = new Chess();
    this.internalMoveTree = ImmutableMap();
  }

  public get moveTree() {
    return this.internalMoveTree;
  }

  public get fen() {
    return this.chess.fen();
  }

  public get pgn() {
    return this.chess.pgn();
  }

  private onUpdate = () => {
    // Call all subscribers;
    this.subscribed.forEach(f => f());
  };

  /**
   * Add a subscribed function that is called when the controller state updates.
   */
  public subscribe = (sub: () => void) => {
    this.subscribed.push(sub);
    return () => {
      this.subscribed = this.subscribed.filter(f => f !== sub);
    };
  };

  private move = (m: string | ShortMove | Move) => {
    this.chess.move(m);
    this.cg?.set(this.calcCGConfig());
    const currentHistory = this.chess.history({ verbose: true });
    this.internalMoveTree = updateTree(currentHistory, this.internalMoveTree);
    this.onUpdate?.();
  };

  private calcCGConfig = (): Config => ({
    fen: this.fen,
    orientation: this.perspective,
    movable: {
      free: false,
      dests: toDests(this.chess),
      color: toTurn(this.chess.turn()),
    },
    turnColor: toTurn(this.chess.turn()),
    check: this.chess.in_check(),
    draggable: {
      showGhost: true,
    },
    events: {
      move: (from, to) => {
        // Chessground Key type is not exactly assignable to the Chess.js short move type but
        // it seems to be good enough for moving
        this.move({ from, to } as ShortMove);
      },
    },
  });

  public flipPerspective = () => {
    this.perspective = this.perspective === 'white' ? 'black' : 'white';
    this.cg?.set(this.calcCGConfig());
  };

  public stepBack = () => {
    this.chess.undo();
    const history = this.chess.history({ verbose: true });
    const last = history.length > 0 ? history[history.length - 1] : undefined;;
    this.cg?.set(this.calcCGConfig());
    this.cg?.set({
      lastMove: last && [last.to, last.from],
    });
    this.onUpdate();
  };
  
  public canStepForward = () => {
    return false; // TODO;
  };

  public stepForward = () => {
    if (!this.canStepForward()) {
      return;
    }
    // TODO;
  };

  public rewind = () => {
    this.setPgn('');
  };

  public fastForward = () => {
    // TODO
  };

  public setPgn = (pgn: string, eraseHistory: boolean = false) => {
    this.chess.load_pgn(pgn);
    const newHistory = this.chess.history({ verbose: true });
    if (eraseHistory) {
      this.internalMoveTree = updateTree(newHistory, ImmutableMap());
    }
    const history = this.chess.history({ verbose: true });
    const last = history.length > 0 ? history[history.length - 1] : undefined;;
    this.cg?.set(this.calcCGConfig());
    this.cg?.set({
      lastMove: last && [last.to, last.from],
    })
    this.onUpdate?.();
  }

  public setFen = (fen: string, eraseHistory: boolean = false) => {
    this.chess.load(fen);
    if (eraseHistory) {
      this.internalMoveTree = ImmutableMap();
    }
    this.cg?.set(this.calcCGConfig());
    this.onUpdate?.();
  };

  public refCallback = (node: null | HTMLDivElement) => {
    // Initialize the chessground view when given an HTML element
    if (node) {
      this.cg = Chessground(node, this.calcCGConfig());
    } else {
      this.cg = null;
    }
  };
}

const ControllerContext = React.createContext(new Controller());
export const ProvideController = ControllerContext.Provider;
export const useController = () => {
  const controller = useContext(ControllerContext);
  // Force a rerender by setting a counter value in a subscribe callback
  const [, setDirty] = useState(0);
  useEffect(() => {
    return controller.subscribe(() => setDirty(d => d + 1));
  }, []);
  return controller;
};

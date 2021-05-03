import React, {useContext, useEffect, useState} from 'react';
import { Api as ChessgroundApi } from 'chessground/api';
import { Chess, ChessInstance, Move, ShortMove } from 'chess.js';
import { Chessground } from 'chessground';
import { Key } from 'chessground/types';
import { OrderedMap as ImmutableMap } from 'immutable';
import {Config} from 'chessground/config';

export interface MoveTree {
  move: Move;
  moveNumber: number;
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

/**
 * Helper for updating the branching tree of PGNs with a new history.
 */
function updateTree(
  moves: Move[],
  tree: ImmutableMap<string, MoveTree>,
  depth: number = 1,
): ImmutableMap<string, MoveTree> {
  if (moves.length === 0) {
    return tree;
  } else {
    const move = moves[0];
    const treeMove = tree.get(move.san);
    const nextDepth = move.color === 'w' ? depth : depth + 1;
    if (treeMove) {
      return tree.set(move.san, {
        ...treeMove,
        branches: updateTree(moves.slice(1), treeMove.branches, nextDepth),
      });
    } else {
      return tree.set(move.san, {
        move,
        moveNumber: depth,
        branches: updateTree(moves.slice(1), ImmutableMap(), nextDepth),
      });
    }
  }
}

/**
 * Helper for locating the current active node in a tree
 */
function getCurrentActiveNode(moves: Move[], tree: ImmutableMap<string, MoveTree>): MoveTree | null {
  if (moves.length === 0) {
    return null;
  }

  const first = moves[0];
  const rest = moves.slice(1);

  const match = tree.get(first.san) ?? null;
  if (match) {
    if (rest.length === 0) {
      return match; 
    } else {
      return getCurrentActiveNode(rest, match.branches);
    }
  } else {
    return null;
  }
}

class Controller {
  private cg: ChessgroundApi | null;
  private chess: ChessInstance;
  private perspective: 'white' | 'black';

  private subscribed: Array<() => void>;
  private internalMoveTree: ImmutableMap<string, MoveTree>;
  public activeMoveNode: MoveTree | null;

  public constructor(initialPerspective?: 'white' | 'black') {
    this.subscribed = [];
    this.cg = null;
    this.perspective = initialPerspective ?? 'white';
    this.chess = new Chess();
    this.internalMoveTree = ImmutableMap();
    this.activeMoveNode = null;
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
    this.activeMoveNode = getCurrentActiveNode(currentHistory, this.internalMoveTree);
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
    this.activeMoveNode = getCurrentActiveNode(this.chess.history({ verbose: true }), this.internalMoveTree);
    this.cg?.set(this.calcCGConfig());
    this.cg?.set({
      lastMove: this.activeMoveNode ? [this.activeMoveNode.move.from, this.activeMoveNode.move.to] : undefined,
    });
    this.onUpdate();
  };
  
  public canStepForward = () => {
    return Boolean(
      (this.activeMoveNode === null && this.internalMoveTree.size > 0) || (this.activeMoveNode && this.activeMoveNode.branches.size > 0)
    );
  };

  public stepForward = () => {
    if (!this.canStepForward()) {
      return;
    }

    // Asserting this exists because canStepForward checks it.
    const firstBranch: MoveTree = this.activeMoveNode === null ? 
      this.internalMoveTree.valueSeq().first()! :
      this.activeMoveNode.branches.valueSeq().first()!;

    this.move(firstBranch.move.san);
    this.cg?.set({
      lastMove: this.activeMoveNode ? [this.activeMoveNode.move.from, this.activeMoveNode.move.to] : undefined,
    });
  };

  public rewind = () => {
    this.setPgn('');
  };

  public fastForward = () => {
    if (!this.canStepForward()) {
      return;
    }
    
    const innerChess = new Chess();
    // Asserting this exists because canStepForward checks it.
    let currentBranch: MoveTree = this.activeMoveNode === null ? 
      this.internalMoveTree.valueSeq().first()! :
      this.activeMoveNode.branches.valueSeq().first()!;

    if (this.activeMoveNode !== null) {
      // If there was an active node the starting point for reconstructing the pgn needs to use the current position
      innerChess.load_pgn(this.chess.pgn());
    }

    innerChess.move(currentBranch.move);
    while (currentBranch.branches.size > 0) {
      currentBranch = currentBranch.branches.first()!;
      innerChess.move(currentBranch.move);
    }

    this.setPgn(innerChess.pgn());
  };

  public setPgn = (pgn: string, eraseHistory: boolean = false) => {
    this.chess.load_pgn(pgn);
    const newHistory = this.chess.history({ verbose: true });
    if (eraseHistory) {
      this.internalMoveTree = updateTree(newHistory, ImmutableMap());
    }
    this.activeMoveNode = getCurrentActiveNode(newHistory, this.internalMoveTree);
    this.cg?.set(this.calcCGConfig());
    this.cg?.set({
      lastMove: this.activeMoveNode ? [this.activeMoveNode.move.from, this.activeMoveNode.move.to] : undefined,
    })
    this.onUpdate?.();
  }

  public setFen = (fen: string, eraseHistory: boolean = false) => {
    this.chess.load(fen);
    this.activeMoveNode = null;
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

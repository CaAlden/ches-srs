import React, {useContext, useEffect, useRef, useState} from 'react';
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

export function removeLine(line: Move[], tree: ImmutableMap<string, MoveTree>): ImmutableMap<string, MoveTree> {
  if (line.length < 1) {
    return ImmutableMap();
  }

  const branch = tree.get(line[0].san);
  if (branch === undefined) {
    // If the move isn't in the tree then just return the tree.
    return tree;
  }

  let i = 0;
  for (let move of branch.moves) {
    if (i >= line.length - 1 && areMovesEqual(move, line[i])) {
      // The move was part of this line so remove the entire branch.
      return tree.remove(line[0].san);
    }
    if (!areMovesEqual(move, line[i])) {
      // The branch doesn't exist in the tree.
      return tree;
    }
    i++;
  }

  const subBranches = removeLine(line.slice(i), branch.branches);
  return tree.set(line[0].san, subBranches.size === 1 ? {
    ...branch,
    moves: [...branch.moves, ...(subBranches.first<MoveTree | undefined>()?.moves ?? [])],
    branches: ImmutableMap(),
  } : {
    ...branch,
    branches: removeLine(line.slice(i), branch.branches),
  });
}

export function removeAfter(line: Move[], tree: ImmutableMap<string, MoveTree>): ImmutableMap<string, MoveTree> {
  if (line.length < 1) {
    return ImmutableMap();
  }

  const branch = tree.get(line[0].san);
  if (branch === undefined) {
    // If the move isn't in the tree then just return the tree.
    return tree;
  }

  // i is needed later so declared outside the loop
  let i = 0;
  for (let j = 0; j < branch.moves.length; j++, i++) {
    if (i === line.length - 1 && areMovesEqual(branch.moves[j], line[i])) {
      const remaining = branch.moves.slice(0, j);
      if (remaining.length === 0) {
        return tree.remove(line[0].san);
      } else {
        return tree.set(line[0].san, {
          ...branch,
          moves: remaining,
          branches: ImmutableMap(),
        });
      }
    }
    if (!areMovesEqual(branch.moves[j], line[i])) {
      // The branch doesn't exist in the tree.
      return tree;
    }
  }

  const subBranches = removeAfter(line.slice(i), branch.branches);
  return tree.set(line[0].san, subBranches.size === 1 ? {
    ...branch,
    moves: [...branch.moves, ...(subBranches.first<MoveTree | undefined>()?.moves ?? [])],
    branches: ImmutableMap(),
  } : {
    ...branch,
    branches: removeAfter(line.slice(i), branch.branches),
  });
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

  public getActiveLine = (): Move[] => {
    const currentLineBase = this.getCurrentHistory();
    // Walk through the history as far as we can
    const line: Move[] = [];
    let activeBranch: MoveTree | undefined = currentLineBase.length === 0 ? this.internalMoveTree.first() : this.internalMoveTree.get(currentLineBase[0].san);

    if (activeBranch === undefined) {
      return line;
    }

    // Keep track of the current point in the move list.
    let cI = 0;
    while(activeBranch !== undefined) {
      // ASSUMPTION: activeBranch.moves is non-empty
      if (cI + activeBranch.moves.length < currentLineBase.length) {
        line.push(...activeBranch.moves);
        cI += activeBranch.moves.length;
        activeBranch = activeBranch.branches.get(currentLineBase[cI].san);
      } else {
        // Otherwise loop to the end of the current branches
        while(activeBranch !== undefined) {
          line.push(...activeBranch.moves); 
          activeBranch = activeBranch.branches.first();
        }
        return line;
      }
    }

    throw new Error('The chess.js history was somehow longer than the internal move tree. This should never be the case');
  };

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

  public move = (m: ShortMove | Move) => {
    this.makeMoves([m]);
  };

  public makeMoves = (moves: Array<Move | ShortMove>, clearHistory: boolean = false) => {
    if (clearHistory) {
      this.chess.load_pgn('');
    }

    for (let m of moves) {
      this.chess.move(m);
    }
    const last = moves.length > 0 ? moves[moves.length - 1] : undefined;
    this.cg?.set(this.calcCGConfig());
    this.cg?.set({
      lastMove: last ? [last.to, last.from] : undefined,
    });
    const currentHistory = this.chess.history({ verbose: true });
    this.internalMoveTree = updateTree(currentHistory, this.internalMoveTree);
    this.onUpdate?.();
  };

  public getCurrentHistory = (): Move[] => {
    return this.chess.history({ verbose: true });
  }

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

  public removeLine = (line: Move[]) => {
    this.internalMoveTree = removeLine(line, this.internalMoveTree);
    // Reset chess
    let branches = this.internalMoveTree;
    let i = 0;
    
    let newHistory: Move[] = [];
    while (branches !== undefined && i < line.length) {
      const branch = branches.get(line[i].san);
      if (branch === undefined) {
        break;
      }
      for (let move of branch.moves) {
        if (i >= line.length) {
          break;
        }
        if (areMovesEqual(move, line[i])) {
          newHistory.push(move);
        }
        i++;
      }
      newHistory.push(...branch.moves);
      branches = branch.branches;
    }

    this.makeMoves(newHistory, true);
  };

  public removeAfter = (line: Move[]) => {
    this.internalMoveTree = removeAfter(line, this.internalMoveTree);
    // Reset chess
    let branches = this.internalMoveTree;
    let i = 0;
    
    let newHistory: Move[] = [];
    while (branches !== undefined && i < line.length) {
      const branch = branches.get(line[i].san);
      if (branch === undefined) {
        break;
      }
      for (let move of branch.moves) {
        if (areMovesEqual(move, line[i])) {
          newHistory.push(move);
        }
        i++;
      }
      newHistory.push(...branch.moves);
      branches = branch.branches;
    }

    this.makeMoves(newHistory, true);
  };

  public flipPerspective = () => {
    this.perspective = this.perspective === 'white' ? 'black' : 'white';
    this.cg?.set(this.calcCGConfig());
  };

  public stepBack = () => {
    this.chess.undo();
    const history = this.chess.history({ verbose: true });
    const last = history.length > 0 ? history[history.length - 1] : undefined;
    this.cg?.set(this.calcCGConfig());
    this.cg?.set({
      lastMove: last && [last.to, last.from],
    });
    this.onUpdate();
  };
  
  public canStepForward = () => {
    return this.getActiveLine().length > this.chess.history().length;
  };

  public stepForward = () => {
    const line = this.getActiveLine();
    const history = this.getCurrentHistory();
    if (line.length > history.length) {
      this.move(line[history.length]);
    }
  };

  public fastForward = () => {
    const line = this.getActiveLine();
    this.makeMoves(line.slice(this.chess.history().length));
  };

  public rewind = () => {
    this.setPgn('');
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
  const isMounted = useRef(false);
  // Force a rerender by setting a counter value in a subscribe callback
  const [, setDirty] = useState(0);
  useEffect(() => {
    isMounted.current = true;
    const unsubscribe = controller.subscribe(() => {
      if (isMounted.current) {
        setDirty(d => d + 1);
      }
    });
    return () => {
      isMounted.current = false;
      unsubscribe();
    };
  }, []);
  return controller;
};

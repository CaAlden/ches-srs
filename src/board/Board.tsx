import React, { useEffect, useRef, useState } from 'react';
import { Chessground } from 'chessground';
import { Key } from 'chessground/types';

import './chessground.css';
import { MoveTree, useChessInstance, useDirtyState, useFlushState, useMoveTreeContext } from '../context';
import { Chess, ChessInstance, Move } from 'chess.js';
import { Map as ImmutableMap } from 'immutable';

export type ChessgroundApi = ReturnType<typeof Chessground>;

export function toDests(chess: ChessInstance): Map<Key, Key[]> {
  const dests = new Map();
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
      return tree.set(
        move.san,
        {
          move,
          moveNumber: depth,
          branches: updateTree(moves.slice(1), ImmutableMap(), nextDepth),
        },
      );
    }
  }
}

export default function Board() {
  const flush = useFlushState();
  const dirty = useDirtyState();
  const chess = useChessInstance();
  const { currentFen, setCurrentFen, tree, setTree } = useMoveTreeContext();
  const [cg, setCg] = useState<null | ChessgroundApi>(null);

  useEffect(() => {
    if (cg) {
      cg.set({
        fen: chess.fen(),
        movable: {
          color: chess.turn() === 'w' ? 'white' : 'black',
          free: false,
          dests: toDests(chess),
        },
        draggable: {
          showGhost: true,
        },
        events: {
          move: (from, to) => {
            chess.move({ from, to } as any);
            const turn = chess.turn() === 'w' ? 'white' : 'black';
            cg.set({
              turnColor: turn,
              movable: {
                dests: toDests(chess),
                color: turn,
              },
            });
            const newTree = updateTree(chess.history({ verbose: true }), tree);
            setCurrentFen(chess.fen());
            console.log(newTree.toJS());
            setTree(newTree);
            flush();
          },
        },
      });
    }
  }, [cg, flush, dirty, currentFen]);

  const clbkRef = useRef((node: HTMLDivElement | null) => {
    if (node) {
      chess.load(currentFen);
      setCg(
        Chessground(node, {
          fen: currentFen,
          resizable: true,
          movable: {
            color: chess.turn() === 'w' ? 'white' : 'black',
            free: false,
            dests: toDests(chess),
          },
          draggable: {
            showGhost: true,
          },
        }),
      );
      flush();
    } else {
      setCg(null);
    }
  });

  return <div id="chessboard" ref={clbkRef.current} />;
}

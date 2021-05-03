import { Chess, ChessInstance, Move } from 'chess.js';
import React, { FC, useMemo } from 'react';
import { useController, MoveTree } from '../controller';

import "./index.css";

const Move: FC<{ move: Move; moveNumber: number; chess: ChessInstance }> = ({ move, moveNumber, chess }) => {
  const controller = useController();
  const isActiveMove = controller.fen === chess.fen();
  const isWhite = move.color === 'w';
  return (
    <>
      {isWhite &&
        <span className="move-number">{`${moveNumber}.`}</span>
      }
      <button
        className={`button-reset ${isWhite ? 'left' : ''} ${isActiveMove ? 'current-move' : 'move'}`}
        onClick={() => {
          controller.setPgn(chess.pgn());
        }}>
        {move.san}
      </button>
    </>
  );
};

const MoveTree: FC<{ moveTree: MoveTree; chess: ChessInstance; depth: number }> = ({ moveTree, chess, depth }) => {
  const nextChessInstances = useMemo(() => {
    return moveTree.branches.map(b => {
      const extended = new Chess();
      extended.load_pgn(chess.pgn());
      extended.move(b.move.san);
      return extended;
    });
  }, [chess, moveTree]);
  const currentMove = <Move chess={chess} move={moveTree.move} moveNumber={moveTree.moveNumber} />;
  return moveTree.branches.size === 0 ? (
    currentMove
  ) : moveTree.branches.size === 1 ? (
    <>
      {currentMove}
      <MoveTree
        moveTree={moveTree.branches.valueSeq().get(0)!}
        depth={depth}
        chess={nextChessInstances.get(moveTree.branches.valueSeq().get(0)!.move.san)!}
      />
    </>
  ) : (
    <div style={{ paddingLeft: `calc(2px * ${depth})` }}>
      {currentMove}
      <div>
        {moveTree.branches
          .map((b, k) => <MoveTree key={k} moveTree={b} chess={nextChessInstances.get(k)!} depth={depth + 1} />)
          .valueSeq()
          .toArray()}
      </div>
    </div>
  );
};

const PGNExplorer: FC = () => {
  const controller = useController();
  const tree = controller.moveTree;
  const initialChessInstances = useMemo(
    () =>
      tree.map(b => {
        const extended = new Chess();
        extended.move(b.move.san);
        return extended;
      }),
    [tree],
  );
  return (
    <div className="pgn-explorer">
      {tree
        .map((subTree, k) => <MoveTree key={k} moveTree={subTree} chess={initialChessInstances.get(k)!} depth={1} />)
        .valueSeq()
        .toArray()}
    </div>
  );
};

export default PGNExplorer;

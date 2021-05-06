import { Move } from 'chess.js';
import React, { FC, useMemo } from 'react';
import { useController, MoveTree } from '../controller';
import { List, OrderedMap as ImmutableMap, is } from 'immutable';

interface IMoveProps {
  history: List<Move>;
  san: string;
}
const MoveComponent: FC<IMoveProps> = ({ san, history }) => {
  const controller = useController();
  return (
    <button onClick={() => controller.makeMoves(history.toArray(), true)} className="btn p-0 w-100">
      {san}
    </button>
  );
};

const MoveTableRow: FC<{ moveNumber: number; white?: Move; black?: Move; base: List<Move> }> = ({
  moveNumber,
  white,
  black,
  base,
}) => {
  const controller = useController();
  const currentHistory = List(controller.getCurrentHistory());
  const whiteMoveHistory = white ? base.push(white) : base;
  const blackMoveHistory = white && black ? base.push(white, black) : black ? base.push(black) : base;
  return (
    <tr className="align-middle">
      <td>{moveNumber}.</td>
      <td className={is(whiteMoveHistory, currentHistory) ? 'table-active' : ''}>
        {white ? <MoveComponent san={white.san} history={base.push(white)} /> : '...'}
      </td>
      <td className={is(blackMoveHistory, currentHistory) ? 'table-active' : ''}>
        {black ? <MoveComponent san={black.san} history={white ? base.push(white, black) : base.push(black)} /> : '...'}
      </td>
    </tr>
  );
};

const Branches: FC<{ branches: ImmutableMap<string, MoveTree>; previousMoves: List<Move> }> = ({
  branches,
  previousMoves,
}) => {
  return branches.size === 0 ? null : (
    <tr>
      <td colSpan={3}>
        <ul className="list-group">
          {branches
            .map((tree, san) => {
              let innerMoves = previousMoves;
              return (
                <li key={san} className="list-group-item list-group-item-action list-group-item-info">
                  {tree.moves.map((move, i) => {
                    const elm = (
                      <React.Fragment key={`${move}-${i}`}>
                        {(move.color === 'w' || i === 0) && (
                          <span className="mr-1">{tree.sectionStart + Math.floor(i / 2)}.</span>
                        )}
                        {move.color === 'b' && i === 0 && <span className="mx-1">...</span>}
                        <MoveComponent san={move.san} history={innerMoves.push(move)} />
                      </React.Fragment>
                    );
                    innerMoves = innerMoves.push(move);
                    return elm;
                  })}
                  <Branches branches={tree.branches} previousMoves={previousMoves.push(...tree.moves)} />
                </li>
              );
            })
            .valueSeq()
            .toArray()}
        </ul>
      </td>
    </tr>
  );
};

/**
 * Helper for grouping moves into pairs for the mainline when rendering.
 */
function pair(arr: Move[]): Array<[Move | undefined, Move | undefined]> {
  const next: Array<[Move | undefined, Move | undefined]> = [];

  // no input means no output.
  if (arr.length === 0) {
    return [];
  }

  // Handling the case of a single input explicitly since it makes the rest of the logic simpler.
  if (arr.length === 1) {
    return [arr[0].color === 'w' ? [arr[0], undefined] : [undefined, arr[0]]];
  }

  let i = 0;
  // This accounts for a possible input that is starting with a black move first.
  // That happens when there was a branch on a white move above this list of moves.
  if (arr[0].color === 'b') {
    next.push([undefined, arr[0]]);
    i++;
  }

  // Next group together as many sets of two moves together as possible.
  for (; i < arr.length - 1; i += 2) {
    next.push([arr[i], arr[i + 1]]);
  }

  // If there is a stray white move at the end, make sure to catch it. This if and the if before
  // the loop should account for all the possible edge cases.
  if (arr[arr.length - 1].color === 'w') {
    next.push([arr[arr.length - 1], undefined]);
  }

  return next;
}

const MovesTable: FC<{ moveTree: ImmutableMap<string, MoveTree> }> = ({ moveTree }) => {
  const chunks = useMemo((): Array<[MoveTree, ImmutableMap<string, MoveTree>]> => {
    const arr: Array<[MoveTree, ImmutableMap<string, MoveTree>]> = [];
    if (!moveTree) {
      return arr;
    }

    let chunk: MoveTree | undefined = moveTree.first();
    while (chunk) {
      arr.push([chunk, chunk.branches.rest()]);
      chunk = chunk.branches.first();
    }
    return arr;
  }, [moveTree]);
  let moveHistory: List<Move> = List();
  return (
    <table className="table table-borderless table-sm m-0">
      <tbody>
        {chunks.map(([chunk, branches]) => (
          <React.Fragment key={`${chunk.moves[0].san}-${chunk.sectionStart}`}>
            {pair(chunk.moves).map(([white, black], i) => {
              const elm = (
                <MoveTableRow
                  key={i}
                  white={white}
                  black={black}
                  moveNumber={chunk.sectionStart + i}
                  base={moveHistory}
                />
              );
              if (white) {
                moveHistory = moveHistory.push(white);
              }
              if (black) {
                moveHistory = moveHistory.push(black);
              }
              return elm;
            })}
            {branches && <Branches branches={branches} previousMoves={moveHistory} />}
          </React.Fragment>
        ))}
        <Branches branches={moveTree.rest()} previousMoves={List()} />
      </tbody>
    </table>
  );
};

export default function PGNExplorer() {
  const controller = useController();

  return <MovesTable moveTree={controller.moveTree} />;
}

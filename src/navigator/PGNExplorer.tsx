import { Move } from 'chess.js';
import React, { FC, useMemo } from 'react';
import { useController, MoveTree } from '../controller';
import { OrderedMap as ImmutableMap } from 'immutable';

interface IMoveProps {
  pgn: string;
  san: string;
}
const MoveComponent: FC<IMoveProps> = ({ san, pgn }) => {
  const controller = useController();
  return (
    <button onClick={() => controller.setPgn(pgn)} className="btn p-0">
      {san}
    </button>
  );
};

const MoveTableRow: FC<{ moveNumber: number; white?: Move; black?: Move; }> = ({
  moveNumber,
  white,
  black,
}) => {
  return (
    <tr className="align-middle">
      <td>{moveNumber}.</td>
      <td>{white ? <MoveComponent san={white.san} pgn={''} /> : '...'}</td>
      <td>{black ? <MoveComponent san={black.san} pgn={''} /> : '...'}</td>
    </tr>
  );
};

const Branches: FC<{ branches: ImmutableMap<string, MoveTree> }> = ({ branches }) => {
  return branches.size === 0 ? null : (
    <tr>
      <td colSpan={3}>
        <ul>
          {branches
            .map((tree, san) => (
              <li key={san}>
                {tree.moves.map((move, i) => (
                  <React.Fragment key={`${move}-${i}`}>
                    {(move.color === 'w' || i === 0) && <span>{tree.sectionStart + Math.floor(i / 2)}.</span>}
                    {move.color === 'b' && i === 0 && <span>...</span>}
                    <span>{move.san}</span>
                  </React.Fragment>
                ))}
                <Branches branches={tree.branches} />
              </li>
            ))
            .valueSeq()
            .toArray()}
        </ul>
      </td>
    </tr>
  );
};

function pair(arr: Move[]): Array<[Move | undefined, Move | undefined]> {
  const next: Array<[Move | undefined, Move | undefined]> = [];

  if (arr.length === 0) {
    return [];
  }

  if (arr.length === 1) {
    return [arr[0].color === 'w' ? [arr[0], undefined] : [undefined, arr[0]]];
  }

  let i = 0;
  if (arr[0].color === 'b') {
    next.push([undefined, arr[0]]);
    i++;
  }

  for (; i < arr.length - 1; i += 2) {
    next.push([arr[i], arr[i + 1]]);
  }

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
  return (
    <table className="table table-borderless table-sm m-0">
      <tbody>
        {chunks.map(([chunk, branches]) => (
          <React.Fragment key={`${chunk.moves[0].san}-${chunk.sectionStart}`}>
            {pair(chunk.moves).map(([white, black], i) => {
              return <MoveTableRow key={i} white={white} black={black} moveNumber={chunk.sectionStart + i} />;
            })}
            {branches && <Branches branches={branches} />}
          </React.Fragment>
        ))}
        <Branches branches={moveTree.rest()} />
      </tbody>
    </table>
  );
};

export default function PGNExplorer() {
  const controller = useController();

  return <MovesTable moveTree={controller.moveTree} />;
}

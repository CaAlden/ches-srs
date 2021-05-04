import { Move } from 'chess.js';
import React, { FC, useMemo } from 'react';
import { useController, MoveTree } from '../controller';
import { OrderedMap as ImmutableMap } from 'immutable';
import Button from '../ui/Button';

import './index.css';

interface IMoveProps {
  san: string;
  active: boolean;
}
const MoveComponent: FC<IMoveProps> = ({ san, active }) => {
  return (
    <Button onClick={() => console.log('TODO')} style={{ fontWeight: active ? 'bold' : 'normal' }}>
      {san}
    </Button>
  );
};

const MoveTableRow: FC<{ moveNumber: number; white?: Move; black?: Move; }> = ({ moveNumber, white, black }) => {
  return (
    <div className="pgn-explorer-row">
      <span>{moveNumber}.</span>
      <span>{white ? <MoveComponent san={white.san} active={false} /> : '...'}</span>
      <span>{black ? <MoveComponent san={black.san} active={false} /> : '...'}</span>
    </div>
  );
};

const Branches: FC<{ branches: ImmutableMap<string, MoveTree> }> = ({ branches }) => {
  return branches.size === 0 ? null : (
    <ul className="branches">{
      branches.map((tree, san) => (
        <li className="branch" key={san}>
          {tree.moves.map((move, i) => 
            <React.Fragment key={move.san}>
              {(move.color === 'w' || i === 0) && <span>{tree.sectionStart + Math.floor(i / 2)}.</span>}
              {move.color === 'b' && i === 0 && <span>...</span>}
              <span>{move.san}</span>
            </React.Fragment>
          )}
          <Branches branches={tree.branches} />
        </li>
      )).valueSeq().toArray()
    }</ul>
  );
};

function pair(arr: Move[]): Array<[Move | undefined, Move | undefined]> {
  const next: Array<[Move | undefined, Move | undefined]> = [];

  if (arr.length === 0) {
    return [];
  }

  if (arr.length === 1) {
    return [
      arr[0].color === 'w' ? [arr[0], undefined] : [undefined, arr[0]],
    ];
  }

  let i = 0;
  if (arr[0].color === 'b') {
    next.push([undefined, arr[0]]);
    i++;
  }

  for(;i < arr.length - 1; i+= 2) {
    next.push([arr[i], arr[i+1]]);
  }

  if (arr[arr.length - 1].color === 'w') {
    next.push([arr[arr.length - 1], undefined]);
  }

  return next;
}

const MovesTable: FC<{ moveTree: ImmutableMap<string, MoveTree> }> = ({ moveTree }) => {
  console.log(moveTree);
  const chunks = useMemo((): Array<[MoveTree, ImmutableMap<string, MoveTree>]> => {
    const arr: Array<[MoveTree, ImmutableMap<string, MoveTree>]> = [];
    if (!moveTree) {
      return arr;
    }

    let chunk: MoveTree | undefined = moveTree.first();
    while(chunk) {
      arr.push([chunk, chunk.branches.rest()]);
      chunk = chunk.branches.first();
    }
    return arr;
  }, [moveTree]);
  return (
    <div className="pgn-explorer">{
      chunks.map(([chunk, branches]) => (
        <React.Fragment key={`${chunk.moves[0].san}-${chunk.sectionStart}`}>
          {pair(chunk.moves).map(([white, black], i) => {
            return <MoveTableRow key={i} white={white} black={black} moveNumber={chunk.sectionStart + i} />;
          })}
          {branches && <Branches branches={branches} />}
        </React.Fragment>
      ))}
      <Branches branches={moveTree.rest()} />
    </div>
  );
};

export default function PGNExplorer() {
  const controller = useController();

  return <MovesTable moveTree={controller.moveTree} />;
}

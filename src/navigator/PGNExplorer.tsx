import { Chess, ChessInstance, Move } from 'chess.js';
import React, { FC, ReactNode, useMemo } from 'react';
import { useController, MoveTree } from '../controller';
import { OrderedMap as ImmutableMap } from 'immutable';
import Button from '../ui/Button';

import './index.css';

function immutableMove(chess: ChessInstance, san: string) {
  const nextState = new Chess();
  nextState.load_pgn(chess.pgn());
  nextState.move(san);
  return nextState;
}

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
    <div>
      <span>{moveNumber}.</span>
      <span>{white ? <MoveComponent san={white.san} active={false} /> : '...'}</span>
      <span>{black ? <MoveComponent san={black.san} active={false} /> : '...'}</span>
    </div>
  );
};

const Branches: FC<{ branches: ImmutableMap<string, MoveTree> }> = ({ branches }) => {
  return branches.size === 0 ? null : (
    <ul>{
      branches.map((tree, san) => (
        <li key={san}>
          {tree.moves.map((move, i) => 
            <React.Fragment key={move.san}>
              {(move.color === 'w' || i === 0) && <span>{tree.sectionStart + i}.</span>}
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

const MovesTable: FC<{ moveTree: ImmutableMap<string, MoveTree> }> = ({ moveTree }) => {
  const groups = useMemo((): Array<[[Move | undefined, Move | undefined], ImmutableMap<string, MoveTree> | undefined]> => {
    const mainlineChunks: Array<[[Move | undefined, Move | undefined], ImmutableMap<string, MoveTree> | undefined]> = [];
    let mainLineBranch: MoveTree | undefined = moveTree.first();
    while(mainLineBranch !== undefined) {
      let i: number;
      for (i = 0; i <= mainLineBranch.moves.length - 2; i += 2) {
        mainlineChunks.push(
          [[mainLineBranch.moves[i], mainLineBranch.moves[i + 1]], i + 2 === mainLineBranch.moves.length ? mainLineBranch.branches.rest() : undefined]
        )
      }

      if (i === mainLineBranch.moves.length - 1) {
        const lastMove = mainLineBranch.moves[i];
        mainlineChunks.push(
          [
            [lastMove, undefined],
            mainLineBranch.branches.rest(),
          ]
        )
      }

      mainLineBranch = mainLineBranch.branches.first();
    }
    return mainlineChunks;
  }, [moveTree]);

  return (
    <div>{groups.map(([mainLine, branches], i) => (
      <React.Fragment key={`${i}-${mainLine[0]?.san}-${mainLine[1]?.san}-${branches?.size}`}>
        <MoveTableRow white={mainLine[0]} black={mainLine[1]} moveNumber={i + 1} />
        {branches && <Branches branches={branches} />}
      </React.Fragment>
    ))
    }</div>
  );
};

export default function PGNExplorer() {
  const controller = useController();

  return <MovesTable moveTree={controller.moveTree} />;
}

import React from 'react';
import { Chess, Move } from 'chess.js';
import { createContext, FC, useContext, useState } from 'react';
import { Map } from 'immutable';

const ChessContext = createContext(new Chess());
export const ChessInstanceProvider = ChessContext.Provider;
export const useChessInstance = () => useContext(ChessContext);

interface IFlushContext {
  flush: () => void;
  dirty: number;
}
const FlushContext = createContext<IFlushContext>({ flush: () => {}, dirty: 0 });
export const ProvideFlushContext: FC = ({ children }) => {
  const [dirty, setDirty] = useState(0);
  return <FlushContext.Provider value={{ flush: () => setDirty(d => d + 1), dirty }}>{children}</FlushContext.Provider>;
};

export const useDirtyState = () => useContext(FlushContext).dirty;
export const useFlushState = () => useContext(FlushContext).flush;

export interface MoveTree {
  moveNumber: number;
  move: Move;
  branches: Map<string, MoveTree>;
}

interface IMoveTreeContext {
  currentFen: string
  setCurrentFen: (fen: string) => void;
  tree: Map<string, MoveTree>;
  setTree: (tree: Map<string, MoveTree>) => void;
}

const MoveTreeContext = createContext<IMoveTreeContext>({
  tree: Map(),
  setTree: () => {},
  currentFen: '',
  setCurrentFen: () => {},
});

export const MoveTreeProvider: FC<{ value?: Map<string, MoveTree> }> = ({ value, children }) => {
  const flush = useFlushState();
  const [moveTree, setMoveTree] = useState<Map<string, MoveTree>>(value ?? Map());
  const [currentFen, setCurrentFen] = useState<string>('');
  return (
    <MoveTreeContext.Provider value={{
      tree: moveTree,
      setTree: setMoveTree,
      currentFen,
      setCurrentFen: (fen) => {
        setCurrentFen(fen);
        flush();
      },
    }}>
      {children}
    </MoveTreeContext.Provider>
  );
};

export const useMoveTreeContext = () => useContext(MoveTreeContext);
export const useMoveTree = () => useContext(MoveTreeContext).tree;
export const useCurrentFen = () => useContext(MoveTreeContext).currentFen;

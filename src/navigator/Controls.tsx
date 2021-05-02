import React, { FC, useMemo } from 'react';
import { MoveTree, useChessInstance, useFlushState, useMoveTree } from '../context';

import "./index.css";

interface IButtonProps {
  onClick: () => void;
}
const ControlButton: FC<IButtonProps> = ({ onClick, children }) => {
  return (
    <button onClick={onClick} className="control-btn">{children}</button>
  );
}

export default function Controls () {
  const game = useChessInstance();
  const flush = useFlushState();
  return (
    <div className="controls-container">
      <ControlButton onClick={() => console.log('Flip')}>🔄</ControlButton>
      <ControlButton onClick={() => {
        game.undo();
        flush();
      }}>⏪</ControlButton>
      <ControlButton onClick={() => console.log('Back')}>⬅️</ControlButton>
      <ControlButton onClick={() => console.log('Forward')}>➡️</ControlButton>
      <ControlButton onClick={() => console.log('FF')}>⏩</ControlButton>
    </div>
  );
}

import React from 'react';
import { useController } from '../controller';
import './chessground.css';

export default function Board() {
  const controller = useController();
  return (
    <div className="card chessboard-positioner">
      <div className="chessboard-container">
        <div id="chessboard" ref={controller.refCallback} />
      </div>
    </div>
  );
}

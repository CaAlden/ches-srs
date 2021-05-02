import React from 'react';
import { useController } from '../controller';
import './chessground.css';

export default function Board() {
  const controller = useController();
  return <div id="chessboard" ref={controller.refCallback} />;
}

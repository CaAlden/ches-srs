import React from 'react';
import Board from './board/Board';

export default function App() {
  return (
    <Board 
      registerService={() => () => {}}
      config={{
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR',
        resizable: true,
      }}
    />
  );
}

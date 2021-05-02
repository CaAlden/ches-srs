import React from 'react';
import Board from './board/Board';
import Navigator from './navigator';

import "./normalize.css";
import "./App.css";
import {MoveTreeProvider, ProvideFlushContext} from './context';

export default function App() {
  return (
    <ProvideFlushContext>
      <MoveTreeProvider>
        <div className="app-container">
          <Board />
          <Navigator />
        </div>
      </MoveTreeProvider>
    </ProvideFlushContext>
  );
}

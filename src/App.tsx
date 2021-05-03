import React from 'react';
import Board from './board/Board';
import Navigator from './navigator';

import "./normalize.css";
import "./App.css";
import TabsContainer from './input/Tabs';
import FENInput from './input/FENInput';
import PGNInput from './input/PGNInput';

export default function App() {
  return (
    <div className="app-container">
      <Board />
      <Navigator />
      <TabsContainer tabs={[
          ['FEN Input', <FENInput />],
          ['PGN Input', <PGNInput />],
        ]}
      />
    </div>
  );
}

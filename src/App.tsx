import React from 'react';
import Board from './board/Board';
import Navigator from './navigator';

import "./normalize.css";
import "./App.css";

export default function App() {
  return (
    <div className="app-container">
      <Board />
      <Navigator />
    </div>
  );
}

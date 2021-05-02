import React from 'react';
import Controls from './Controls';
import PGNExplorer from './PGNExplorer';
import PlayerInfo from './PlayerInfo';

import "./index.css";

export default function Navigator() {
  return (
    <div className="navigator-container">
      <PlayerInfo />
      <Controls />
      <PGNExplorer />
      <PlayerInfo />
    </div>
  );
}

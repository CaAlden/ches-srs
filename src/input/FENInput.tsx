import { pipe } from 'fp-ts/lib/function';
import { getOrElse } from 'fp-ts/lib/Either';
import React, { useEffect, useState } from 'react';
import { useController } from '../controller';
import Button from '../ui/Button';
import { FENCodec } from './codecs';

import './index.css';

export default function FENInput() {
  const controller = useController();
  const [fen, setFen] = useState(controller.fen);

  useEffect(() => {
    setFen(controller.fen);
  }, [controller.fen]);

  return (
    <div className="input-container">
      <textarea
        className="text-input"
        placeholder="Input FEN"
        value={fen}
        onChange={e => setFen(e.target.value)}
        spellCheck={false}
      />
      <div className="submit-container">
        <Button
          className="submit-btn"
          style={{
            padding: '5px',
            background: 'blue',
            color: 'white',
          }}
          onClick={() =>
            pipe(
              FENCodec.decode(fen),
              getOrElse(() => controller.fen),
              (decoded) => controller.setFen(decoded, true),
            )
          }>
          Load
        </Button>
      </div>
    </div>
  );
}

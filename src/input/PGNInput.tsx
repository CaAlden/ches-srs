import { pipe } from 'fp-ts/lib/function';
import { getOrElse } from 'fp-ts/lib/Either';
import React, { useEffect, useState } from 'react';
import { useController } from '../controller';
import Button from '../ui/Button';
import { PGNCodec } from './codecs';

import './index.css';

export default function PGNInput() {
  const controller = useController();
  const [pgn, setPgn] = useState(controller.pgn);

  useEffect(() => {
    setPgn(controller.pgn);
  }, [controller.pgn]);

  return (
    <div className="input-container">
      <textarea
        className="text-input"
        placeholder="Input PGN"
        value={pgn}
        onChange={e => setPgn(e.target.value)}
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
              PGNCodec.decode(pgn),
              getOrElse(() => controller.pgn),
              (decoded) => controller.setPgn(decoded, true),
            )
          }>
          Load
        </Button>
      </div>
    </div>
  );
}

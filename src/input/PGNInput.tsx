import { pipe } from 'fp-ts/lib/function';
import { getOrElse } from 'fp-ts/lib/Either';
import React, { useEffect, useState } from 'react';
import { useController } from '../controller';
import Button from '../ui/Button';
import { PGNCodec } from './codecs';

export default function PGNInput() {
  const controller = useController();
  const [pgn, setPgn] = useState(controller.pgn);

  useEffect(() => {
    setPgn(controller.pgn);
  }, [controller.pgn]);

  return (
    <div>
      <textarea placeholder="Input PGN" value={pgn} onChange={e => setPgn(e.target.value)} />
      <Button
        onClick={() =>
          pipe(
            PGNCodec.decode(pgn),
            getOrElse(() => controller.fen),
          )
        }>
        Load
      </Button>
    </div>
  );
}

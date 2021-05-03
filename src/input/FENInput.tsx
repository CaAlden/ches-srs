import { pipe } from 'fp-ts/lib/function';
import { getOrElse } from 'fp-ts/lib/Either';
import React, { useEffect, useState } from 'react';
import { useController } from '../controller';
import Button from '../ui/Button';
import { FENCodec } from './codecs';

export default function FENInput() {
  const controller = useController();
  const [fen, setFen] = useState(controller.fen);

  useEffect(() => {
    setFen(controller.fen);
  }, [controller.fen]);

  return (
    <div>
      <textarea placeholder="Input FEN" value={fen} onChange={e => setFen(e.target.value)} />
      <Button
        onClick={() =>
          pipe(
            FENCodec.decode(fen),
            getOrElse(() => controller.fen),
          )
        }>
        Load
      </Button>
    </div>
  );
}

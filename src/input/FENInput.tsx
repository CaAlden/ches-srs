import { pipe } from 'fp-ts/lib/function';
import { getOrElse } from 'fp-ts/lib/Either';
import React, { useEffect, useState } from 'react';
import { useController } from '../controller';
import { FENCodec } from '../codecs';

export default function FENInput() {
  const controller = useController();
  const [fen, setFen] = useState(controller.fen);

  useEffect(() => {
    setFen(controller.fen);
  }, [controller.fen]);

  return (
    <div className="col-12">
      <textarea
        className="w-100"
        placeholder="Input FEN"
        style={{ resize: 'none'}}
        value={fen}
        onChange={e => setFen(e.target.value)}
        spellCheck={false}
      />
      <div className="d-flex justify-content-end p-2">
        <button
          className="btn btn-primary"
          onClick={() =>
            pipe(
              FENCodec.decode(fen),
              getOrElse(() => controller.fen),
              (decoded) => controller.setFen(decoded, true),
            )
          }>
          Load
        </button>
      </div>
    </div>
  );
}

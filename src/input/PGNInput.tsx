import { pipe } from 'fp-ts/lib/function';
import { getOrElse } from 'fp-ts/lib/Either';
import React, { useEffect, useState } from 'react';
import { useController } from '../controller';
import { PGNCodec } from './codecs';

export default function PGNInput() {
  const controller = useController();
  const [pgn, setPgn] = useState(controller.pgn);

  useEffect(() => {
    setPgn(controller.pgn);
  }, [controller.pgn]);

  return (
    <div className="col-12">
      <textarea
        className="w-100"
        placeholder="Input PGN"
        style={{ resize: 'none' }}
        value={pgn}
        onChange={e => setPgn(e.target.value)}
        spellCheck={false}
      />
      <div className="d-flex justify-content-end p-2">
        <button
          className="btn btn-primary"
          onClick={() =>
            pipe(
              PGNCodec.decode(pgn),
              getOrElse(() => controller.pgn),
              (decoded) => controller.setPgn(decoded, true),
            )
          }>
          Load
        </button>
      </div>
    </div>
  );
}

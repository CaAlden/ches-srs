import React, { useRef } from 'react';
import { Chessground } from 'chessground';

import "./chessground.css";

type ChessgroundApi = ReturnType<typeof Chessground>;
type UnsubscribeFunction = () => void;

interface IProps {
  config: Parameters<typeof Chessground>[1];
  registerService?: (chessApi: ChessgroundApi) => UnsubscribeFunction;
}

export default function Board(props: IProps) {
  const unsubscribeRef = useRef<null | UnsubscribeFunction>(null);
  const clbkRef = useRef((node: HTMLDivElement | null) => {
    if (node) {
      const ground = Chessground(node, props.config);
      if (props.registerService) {
        unsubscribeRef.current?.();
        unsubscribeRef.current = props.registerService(ground);
      }
    } else {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
    }
  });

  return (
    <div id="chessboard" ref={clbkRef.current} />
  );
}

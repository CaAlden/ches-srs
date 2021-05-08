import React, { FC, useEffect, useRef } from 'react';
import { useController } from '../controller';
import {useIsMounted} from '../utils';

interface IButtonProps {
  onClick: () => void;
  disabled?: boolean;
  keyCode?: string;
  shift?: boolean;
}

const ControlButton: FC<IButtonProps> = ({ onClick, children, disabled, keyCode, shift }) => {
  const btnRef = useRef<null | HTMLButtonElement>(null);
  const isMounted = useIsMounted();

  useEffect(() => {
    const keyListener = (e: KeyboardEvent) => {
      if (isMounted.current && !disabled) {
        if (e.code === keyCode && (!shift || e.shiftKey)) {
          e.preventDefault();
          onClick();
          btnRef.current?.focus();
        }
      }
    };
    addEventListener('keydown', keyListener);
    return () => {
      removeEventListener('keydown', keyListener);
    };
  }, [isMounted, keyCode, disabled, shift]);

  return (
    <button
      ref={btnRef}
      disabled={false}
      aria-disabled={disabled}
      onClick={onClick}
      className={`btn btn-outline-primary btn-sm${disabled ? ' disabled' : ''}`}>
      {children}
    </button>
  );
};

export default function Controls() {
  const controller = useController();
  const canGoBack = controller.getCurrentHistory().length > 0;
  const canStepForward = controller.canStepForward();
  return (
    <div className="btn-group flex-grow-1" role="group">
      <ControlButton
        keyCode="KeyF"
        onClick={() => {
          controller.flipPerspective();
        }}>
        <i className="bi-arrow-repeat" />
      </ControlButton>
      <ControlButton
        disabled={!canGoBack}
        shift
        keyCode="ArrowLeft"
        onClick={() => {
          // Set the game to blank.
          controller.rewind();
        }}>
        <i className="bi-skip-backward-fill" />
      </ControlButton>
      <ControlButton keyCode="ArrowLeft" disabled={!canGoBack} onClick={() => controller.stepBack()}>
        <i className="bi-skip-start-fill" />
      </ControlButton>
      <ControlButton keyCode="ArrowRight" disabled={!canStepForward} onClick={() => controller.stepForward()}>
        <i className="bi-skip-end-fill" />
      </ControlButton>
      <ControlButton shift keyCode="ArrowRight" disabled={!canStepForward} onClick={() => controller.fastForward()}>
        <i className="bi-skip-forward-fill" />
      </ControlButton>
    </div>
  );
}

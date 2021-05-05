import React, { FC } from 'react';
import { useController } from '../controller';

interface IButtonProps {
  onClick: () => void;
  disabled?: boolean;
}
const ControlButton: FC<IButtonProps> = ({ onClick, children, disabled }) => {
  return (
    <button disabled={false} aria-disabled={disabled} onClick={onClick} className="btn btn-outline-primary btn-sm">
      {children}
    </button>
  );
};

export default function Controls() {
  const controller = useController();
  return (
    <div className="btn-group flex-grow-1" role="group">
      <ControlButton
        onClick={() => {
          controller.flipPerspective();
        }}>
        <i className="bi-arrow-repeat" />
      </ControlButton>
      <ControlButton
        onClick={() => {
          // Set the game to blank.
          controller.rewind();
        }}>
        <i className="bi-skip-backward-fill" />
      </ControlButton>
      <ControlButton onClick={() => controller.stepBack()}><i className="bi-skip-start-fill" /></ControlButton>
      <ControlButton onClick={() => controller.stepForward()}><i className="bi-skip-end-fill" /></ControlButton>
      <ControlButton onClick={() => controller.fastForward()}><i className="bi-skip-forward-fill" /></ControlButton>
    </div>
  );
}

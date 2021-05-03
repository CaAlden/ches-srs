import React, { FC } from 'react';
import { useController } from '../controller';
import Button from '../ui/Button';

import './index.css';

interface IButtonProps {
  onClick: () => void;
  disabled?: boolean;
}
const ControlButton: FC<IButtonProps> = ({ onClick, children, disabled }) => {
  return (
    <Button disabled={false} aria-disabled={disabled} onClick={onClick} className="control-btn">
      {children}
    </Button>
  );
};

export default function Controls() {
  const controller = useController();
  return (
    <div className="controls-container">
      <ControlButton
        onClick={() => {
          controller.flipPerspective();
        }}>
        🔄
      </ControlButton>
      <ControlButton
        onClick={() => {
          // Set the game to blank.
          controller.rewind();
        }}>
        ⏪
      </ControlButton>
      <ControlButton onClick={() => controller.stepBack()}>⬅️</ControlButton>
      <ControlButton onClick={() => controller.stepForward()}>➡️</ControlButton>
      <ControlButton onClick={() => controller.fastForward()}>⏩</ControlButton>
    </div>
  );
}

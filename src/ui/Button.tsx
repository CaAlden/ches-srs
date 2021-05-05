import React, { FC } from 'react';

interface IButtonProps {
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.HTMLProps<HTMLButtonElement>['style'];
}

const Button: FC<IButtonProps> = ({ children, disabled, onClick, style, className }) => (
  <button
    style={style}
    className={`button-reset ${className ? className : ''} ${disabled ? 'disabled' : ''}`}
    type={onClick ? 'button' : 'submit'}
    disabled={false}
    aria-disabled={disabled}
    onClick={onClick}>
    {children}
  </button>
);

export default Button;

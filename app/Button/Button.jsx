import React from 'react';
import style from './Button.css';

const Button = (props) => {
  const {children, ...buttonProps} = props;

  return (
    <button className={style.styledButton} {...buttonProps}>
      {children}
    </button>
  )
};

Button.displayName = 'Button';

Button.propTypes = {
  children: React.PropTypes.oneOfType([
    React.PropTypes.arrayOf(React.PropTypes.node),
    React.PropTypes.node,
  ]),
};

export default Button;

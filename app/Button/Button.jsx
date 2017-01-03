import React from 'react';
import style from './Button.css';

const Button = (props) => {
  const { children, danger } = props;
  const buttonProps = Object.keys(props)
    .filter(e => e !== 'children' && e !== 'danger')
    .reduce((previous, current) => {
      previous[current] = props[current]; // eslint-disable-ligne no-param-reassign
      return previous;
    }, {});

  return (
    <button
      className={`${style.styledButton} ${danger ? style.danger : ''}`}
      {...buttonProps}
    >
      {children}
    </button>
  );
};

Button.displayName = 'Button';

Button.propTypes = {
  danger: React.PropTypes.bool,
  children: React.PropTypes.oneOfType([
    React.PropTypes.arrayOf(React.PropTypes.node),
    React.PropTypes.node,
  ]),
};

export default Button;

import React from 'react';
import style from './Button.css';

const Button = (props) => {
  const { children, type } = props;

  const buttonProps = Object.keys(props)
    .filter(e => e !== 'children' && e !== 'type')
    .reduce((previous, current) => {
      previous[current] = props[current]; // eslint-disable-line no-param-reassign
      return previous;
    }, {});

  return (
    <button
      className={`${style.styledButton} ${style[type]}`}
      {...buttonProps}
    >
      {children}
    </button>
  );
};

Button.displayName = 'Button';

Button.propTypes = {
  type: React.PropTypes.oneOf([
    'primary',
    'success',
    'info',
    'warning',
    'danger',
  ]).isRequired,
  children: React.PropTypes.oneOfType([
    React.PropTypes.arrayOf(React.PropTypes.node),
    React.PropTypes.node,
  ]),
};

Button.defaultProps = {
  type: 'primary',
};

export default Button;

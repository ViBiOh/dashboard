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

  // div-wrapper is needed for Firefox compatibility http://stackoverflow.com/a/32119435
  return (
    <button className={`${style.button} ${props.left ? style.left : ''}`} {...buttonProps}>
      <div
        className={`${style.wrapper} ${style[type]}`}
      >
        {children}
      </div>
    </button>
  );
};

Button.displayName = 'Button';

Button.propTypes = {
  type: React.PropTypes.oneOf([
    'transparent',
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
  left: React.PropTypes.bool,
};

Button.defaultProps = {
  type: 'primary',
  children: '',
  left: false,
};

export default Button;

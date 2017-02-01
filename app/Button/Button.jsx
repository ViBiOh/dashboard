import React from 'react';
import style from './Button.css';

const Button = (props) => {
  const { children, type } = props;

  const buttonProps = Object.keys(props)
    .filter(e => e !== 'children' && e !== 'type' && e !== 'active')
    .reduce((previous, current) => {
      previous[current] = props[current]; // eslint-disable-line no-param-reassign
      return previous;
    }, {});

  // div-wrapper is needed for Firefox compatibility http://stackoverflow.com/a/32119435
  return (
    <button type="button" className={`${style.button} ${props.parentClassName}`} {...buttonProps}>
      <div className={`${style.wrapper} ${style[type]} ${props.active ? style.active : ''}`}>
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
    'none',
  ]).isRequired,
  children: React.PropTypes.oneOfType([
    React.PropTypes.arrayOf(React.PropTypes.node),
    React.PropTypes.node,
  ]),
  active: React.PropTypes.bool,
  parentClassName: React.PropTypes.string,
};

Button.defaultProps = {
  parentClassName: '',
  type: 'primary',
  children: '',
  active: false,
};

export default Button;

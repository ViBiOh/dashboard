import React from 'react';
import classnames from 'classnames';
import style from './Button.css';

const Button = (props) => {
  const { children, type } = props;

  const buttonProps = Object.keys(props)
    .filter(e => !Button.propTypes[e])
    .reduce((previous, current) => {
      previous[current] = props[current]; // eslint-disable-line no-param-reassign
      return previous;
    }, {});

  let content = children;
  if (Array.isArray(children)) {
    content = (
      <div className={`${style.wrapper}`}>
        {children}
      </div>
    );
  }

  const btnClassNames = classnames({
    [style.button]: true,
    [style[type]]: true,
    [props.className]: true,
    [style.active]: props.active,
  });

  return (
    <button type="button" className={btnClassNames} {...buttonProps}>
      {content}
    </button>
  );
};

Button.displayName = 'Button';

Button.propTypes = {
  children: React.PropTypes.oneOfType([
    React.PropTypes.arrayOf(React.PropTypes.node),
    React.PropTypes.node,
  ]),
  type: React.PropTypes.oneOf([
    'transparent',
    'primary',
    'success',
    'info',
    'warning',
    'danger',
    'none',
  ]).isRequired,
  active: React.PropTypes.bool,
  className: React.PropTypes.string,
};

Button.defaultProps = {
  className: '',
  type: 'primary',
  children: '',
  active: false,
};

export default Button;

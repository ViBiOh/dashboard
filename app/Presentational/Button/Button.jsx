import React from 'react';
import classnames from 'classnames';
import style from './Button.css';

const Button = ({ children, type, active, className, ...buttonProps }) => {
  let content = children;
  if (Array.isArray(children)) {
    content = (
      <div className={style.wrapper}>
        {children}
      </div>
    );
  }

  const btnClassNames = classnames({
    [style.button]: true,
    [style[type]]: true,
    [className]: true,
    [style.active]: active,
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
  children: null,
  type: 'primary',
  active: false,
  className: '',
};

export default Button;

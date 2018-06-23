import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import style from './index.css';

/**
 * Button.
 * @param Object} props Props of the component.
 * @return {React.Component} Button with rendered children.
 */
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
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
  type: PropTypes.oneOf(['transparent', 'primary', 'success', 'info', 'warning', 'danger', 'none']),
  active: PropTypes.bool,
  className: PropTypes.string,
};

Button.defaultProps = {
  children: null,
  type: 'primary',
  active: false,
  className: '',
};

export default Button;

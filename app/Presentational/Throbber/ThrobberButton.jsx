import React from 'react';
import Button from '../../Presentational/Button/Button';
import Throbber from './Throbber';
import style from './ThrobberButton.css';

const ThrobberButton = ({ pending, onClick, children, ...buttonProps }) => (
  <Button {...buttonProps} onClick={onClick}>
    {pending ? <Throbber className={style.white} /> : children}
  </Button>
);

ThrobberButton.displayName = 'ThrobberButton';

ThrobberButton.propTypes = {
  pending: React.PropTypes.bool,
  onClick: React.PropTypes.func,
  children: React.PropTypes.oneOfType([
    React.PropTypes.arrayOf(React.PropTypes.node),
    React.PropTypes.node,
  ]),
};

ThrobberButton.defaultProps = {
  pending: false,
  onClick: () => null,
  children: '',
};

export default ThrobberButton;

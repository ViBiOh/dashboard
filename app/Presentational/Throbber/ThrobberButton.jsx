import React from 'react';
import PropTypes from 'prop-types';
import Button from '../../Presentational/Button/Button';
import Throbber from './Throbber';
import style from './ThrobberButton.css';

/**
 * Throbber wrapped in a Button for displaying background task on click.
 * @param {Object} props Props of the component.
 * @return {React.Component} Button with wrapped children or Thorbber if pending.
 */
const ThrobberButton = ({ pending, onClick, children, ...buttonProps }) => (
  <Button {...buttonProps} onClick={e => (pending ? null : onClick(e))}>
    {pending ? <Throbber className={style.white} /> : children}
  </Button>
);

ThrobberButton.displayName = 'ThrobberButton';

ThrobberButton.propTypes = {
  pending: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
};

ThrobberButton.defaultProps = {
  pending: false,
  children: '',
};

export default ThrobberButton;

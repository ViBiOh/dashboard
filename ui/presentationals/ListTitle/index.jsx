import React from 'react';
import PropTypes from 'prop-types';
import { FaCubes } from 'react-icons/fa';
import Filter from '../Filter';
import style from './index.css';

/**
 * ListTitle Functional Component.
 */
export default function ListTitle({ count, filter, onFilterChange }) {
  return (
    <span className={style.size} title="Number of containers">
      {count}
      <FaCubes />
      <Filter value={filter} onChange={onFilterChange} />
    </span>
  );
}

ListTitle.displayName = 'ListTitle';

ListTitle.propTypes = {
  count: PropTypes.node,
  filter: PropTypes.string,
  onFilterChange: PropTypes.func.isRequired,
};

ListTitle.defaultProps = {
  count: 0,
  filter: '',
};

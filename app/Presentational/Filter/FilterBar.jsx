import React from 'react';
import PropTypes from 'prop-types';
import style from './FilterBar.less';

/**
 * Input for setting filter value.
 */
const FilterBar = ({ value, onChange }) =>
  (<input
    type="text"
    name="search"
    placeholder="Filter..."
    value={value}
    className={style.search}
    onChange={e => onChange(e.target.value)}
  />);

FilterBar.displayName = 'FilterBar';

FilterBar.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

FilterBar.defaultProps = {
  value: '',
};

export default FilterBar;

import React from 'react';
import PropTypes from 'prop-types';

/**
 * Input for setting filter value.
 */
const FilterBar = ({ value, onChange }) =>
  (<input
    type="text"
    name="search"
    placeholder="Filter..."
    value={value}
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

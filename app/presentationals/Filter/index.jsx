import React from 'react';
import PropTypes from 'prop-types';
import style from './index.less';

/**
 * Input for setting filter value.
 */
const Filter = ({ value, onChange }) =>
  (<input
    data-search
    type="text"
    name="search"
    placeholder="Filter..."
    value={value}
    className={style.search}
    onChange={e => onChange(e.target.value)}
  />);

Filter.displayName = 'Filter';

Filter.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

Filter.defaultProps = {
  value: '',
};

export default Filter;

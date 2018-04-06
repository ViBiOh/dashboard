import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { DEBOUNCE_TIMEOUT } from '../../Constants';
import style from './index.css';

/**
 * Input for setting filter value.
 */
export default class Filter extends Component {
  /**
   * Creates an instance of Filter.
   * @param {Object} props React initial props
   */
  constructor(props) {
    super(props);

    /**
     * React state of component.
     * @type {Object}
     */
    this.state = {
      value: props.value,
    };

    this.debouncedOnChange = this.debouncedOnChange.bind(this);
  }

  /**
   * Trigger on change event after a small delay.
   * @param {String} value New value of filter
   */
  debouncedOnChange(value) {
    clearTimeout(this.onChangeTimeout);

    this.setState({ value });

    /**
     * Timeout key for making a debounce.
     */
    this.onChangeTimeout = setTimeout(() => {
      this.props.onChange(this.state.value);
    }, DEBOUNCE_TIMEOUT);
  }

  /**
   * React lifecycle.
   * @return {ReactComponent} DOM Node
   */
  render() {
    return (
      <input
        data-search
        type="text"
        name="search"
        placeholder="Filter..."
        value={this.state.value}
        className={style.search}
        onChange={e => this.debouncedOnChange(e.target.value)}
      />
    );
  }
}

Filter.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

Filter.defaultProps = {
  value: '',
};

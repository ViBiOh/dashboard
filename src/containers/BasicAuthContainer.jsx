import React from 'react';
import { connect } from 'react-redux';
import actions from 'actions';
import SearchParams from 'utils/SearchParams';
import Wrapper from 'presentationals/Login/Wrapper';
import Basic from 'presentationals/Login/Basic';

/**
 * Select props from Redux state.
 * @param {Object} state Current state
 */
function mapStateToProps(state, { location: { search } }) {
  const params = SearchParams(search);

  return {
    pending: !!state.pending[actions.LOGIN],
    error: state.error,
    redirect: params.redirect,
  };
}

/**
 * Provide dispatch functions in props.
 * @param {Function} dispatch Redux dispatch function
 */
function mapDispatchToProps(dispatch) {
  return {
    component: (
      <Basic
        onLogin={(username, password, redirect) => {
          dispatch(actions.login(username, password, redirect));
        }}
      />
    ),
  };
}

/**
 * Container for handling login view.
 */
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Wrapper);

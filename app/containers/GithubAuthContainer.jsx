import React from 'react';
import { connect } from 'react-redux';
import SearchParams from '../utils/SearchParams';
import actions from '../actions';
import Wrapper from '../presentationals/Login/Wrapper';
import Github from '../presentationals/Login/Github';

/**
 * Select props from Redux state.
 * @param {Object} state Current state
 */
const mapStateToProps = (state, props) => {
  const params = SearchParams(props.location.search);

  return {
    error: params.error_description || state.error,
    state: params.state,
    code: params.code,
    redirect: params.redirect,
  };
};

/**
 * Provide dispatch functions in props.
 * @param {Function} dispatch Redux dispatch function
 */
const mapDispatchToProps = dispatch => ({
  component: (
    <Github
      getAccessToken={(state, code, redirect) =>
        dispatch(actions.getGithubAccessToken(state, code, redirect))}
    />
  ),
});

/**
 * Github connected.
 */
export default connect(mapStateToProps, mapDispatchToProps)(Wrapper);

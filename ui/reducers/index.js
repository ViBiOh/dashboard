import { combineReducers } from 'redux';
import actions from '../actions';
import { buildFullTextRegex, fullTextRegexFilter, flatValues } from '../utils/Search';
import containers from './containers';
import container from './container';
import logs from './logs';
import stats from './stats';
import pending from './pending';
import error from './error';
import bus from './bus';
import filter from './filter';

/**
 * Combined reducers of app.
 * @type {Function}
 */
const reducers = combineReducers({
  bus,
  container,
  containers,
  filteredContainers: (state = []) => state,
  error,
  filter,
  logs,
  pending,
  stats,
});

/**
 * Overriden app reducers for handling filter from query or redux.
 * @param {Object} state Previous state
 * @param {Object} action Action dispatched
 * @return {Object} New state
 */
function appReducers(state, action) {
  const nextState = reducers(state, action);

  if (
    nextState.containers &&
    (action.type === actions.CHANGE_FILTER || action.type === actions.FETCH_CONTAINERS_SUCCEEDED)
  ) {
    const regexFilter = buildFullTextRegex(nextState.filter);
    nextState.filteredContainers = nextState.containers.filter(e =>
      fullTextRegexFilter(flatValues(e).join(' '), regexFilter));
  }

  return nextState;
}

/**
 * App's reducers.
 */
export default appReducers;

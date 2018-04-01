import actions from '../actions';

/**
 * Bus's reducer.
 * @param  {Bool} state  Existing bus's state
 * @param  {Object} action Action dispatched
 * @return {Bool}        New state
 */
export default (state = false, action) => {
  switch (action.type) {
    case actions.BUS_OPENED:
      return true;
    case actions.BUS_CLOSED:
      return false;
    default:
      return state;
  }
};

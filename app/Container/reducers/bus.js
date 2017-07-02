import actions from '../actions';

export default (state = false, action) => {
  switch (action.type) {
    case actions.BUS_OPENED:
      return true;
    case actions.BUS_CLOSED:
      return true;
    default:
      return state;
  }
};

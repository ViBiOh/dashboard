import actions from '../actions';

export default (state = {}, action) => {
  switch (action.type) {
    case actions.COMPOSE_CHANGE:
      return {
        name: action.name,
        file: action.file,
      };
    default:
      return state;
  }
};

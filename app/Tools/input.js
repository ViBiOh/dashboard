/**
 * Handler for keyDown event on keyboard input.
 * @param  {Object}   event    Event dispatched
 * @param  {Function} callback Callback called when press Enter;
 */
export default function onKeyDown(event, callback) {
  if (event.keyCode === 13) {
    callback();
  }
}

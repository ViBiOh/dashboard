/**
 * Set ref of component in ReactComponent
 * @param {Object} that      ReactComponent context
 * @param {String} name      Ref name
 * @param {Object} component Component to bind to name
 */
export default function setRef(that, name, component) {
  that[name] = component; // eslint-disable-line no-param-reassign
}

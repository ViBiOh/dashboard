import { getApiUrl, getWsUrl, STORAGE_KEY_AUTH } from '../../Constants';
import localStorage from '../LocalStorage';
import { auth } from '../Commons';

/**
 * Docker API Service.
 */
export default class Docker {
  /**
   * Docker's daemon information.
   * @return {Promise} Information of daemon
   */
  static info() {
    return auth(`${getApiUrl()}/info`).get();
  }

  /**
   * List Docker's containers.
   * @return {Promise} Array of informations wrapped in a Promise
   */
  static containers() {
    return auth(`${getApiUrl()}/containers`).get().then(({ results }) => results);
  }

  /**
   * Retrieve informations about a Docker's container.
   * @param  {String} containerId Container's id
   * @return {Promise}            Information wrapped in a Promise
   */
  static containerInfos(containerId) {
    return auth(`${getApiUrl()}/containers/${containerId}/`).get();
  }

  /**
   * Create Docker's container from Docker Compose file.
   * @param  {String} name        Name of the stack
   * @param  {String} composeFile Docker Compose file content
   * @return {Promise}            Array of created containers wrapped in a Promise
   */
  static containerCreate(name, composeFile) {
    return auth(`${getApiUrl()}/containers/${name}/`).post(composeFile);
  }

  /**
   * Start Docker's container.
   * @param  {String} containerId Container's id
   * @return {Promise}            Resolved promise
   */
  static containerStart(containerId) {
    return auth(`${getApiUrl()}/containers/${containerId}/start`).post();
  }

  /**
   * Stop Docker's container.
   * @param  {String} containerId Container's id
   * @return {Promise}            Resolved promise
   */
  static containerStop(containerId) {
    return auth(`${getApiUrl()}/containers/${containerId}/stop`).post();
  }

  /**
   * Restart Docker's container.
   * @param  {String} containerId Container's id
   * @return {Promise}            Resolved promise
   */
  static containerRestart(containerId) {
    return auth(`${getApiUrl()}/containers/${containerId}/restart`).post();
  }

  /**
   * Delete Docker's container.
   * @param  {String} containerId Container's id
   * @return {Promise}            Resolved promise
   */
  static containerDelete(containerId) {
    return auth(`${getApiUrl()}/containers/${containerId}/`).delete();
  }

  /**
   * Open WebSocket with auth token for connecting to two-way bus.
   * @param  {Function} onMessage Callback for each input receive from socket
   * @return {Websocket}          Opened and authentified Websocket
   */
  static streamBus(onMessage) {
    const socket = new WebSocket(`${getWsUrl()}/bus`);

    socket.onmessage = event => onMessage(event.data);
    socket.onopen = () => socket.send(localStorage.getItem(STORAGE_KEY_AUTH));

    return socket;
  }

  /**
   * List Docker's Swarm services.
   * @return {Promise} Array of informations wrapped in a Promise
   */
  static services() {
    return auth(`${getApiUrl()}/services`).get().then(({ results }) => results);
  }
}

import funtch, { errorHandler } from 'funtch';
import btoa from '../Tools/btoa';
import localStorageService from './LocalStorageService';

const IS_SECURE = process.env.API_SECURE || /^https/.test(document.location.origin);
const API_HOST =
  process.env.API_HOST || document.location.host.replace(/dashboard/i, 'dashboard-api');

const API = `http${IS_SECURE ? 's' : ''}://${API_HOST}/`;
const WS = `ws${IS_SECURE ? 's' : ''}://${API_HOST}/ws/`;

/**
 * Storage key name for authentification token.
 */
export const authStorage = 'auth';

/**
 * Custom error handler that add toString to error object.
 * @param  {Object} response Response from funtch
 * @return {Promise} Error with toString or valid reponse
 */
export function customError(response) {
  return new Promise((resolve, reject) =>
    errorHandler(response).then(resolve).catch(err =>
      reject({
        ...err,
        toString: () => {
          if (typeof err.content === 'string') {
            return err.content;
          }
          return JSON.stringify(err.content);
        },
      }),
    ),
  );
}

/**
 * Generate FetchBuilder for given URL with auth and error handler.
 * @param  {String} url              Wanted URL
 * @param  {String} authentification Auth value
 * @return {FetchBuilder} FetchBuilder pre-configured
 */
function auth(url, authentification = localStorageService.getItem(authStorage)) {
  if (!authentification) {
    const authError = new Error('Authentification not find');
    authError.noAuth = true;
    throw authError;
  }

  return funtch.url(url).error(customError).auth(authentification);
}

/**
 * Docker API Service.
 */
export default class DockerService {
  /**
   * Check if User is already logged.
   * @return {Boolean} True if User has authentification token, false  otherwise.
   */
  static isLogged() {
    return !!localStorageService.getItem(authStorage);
  }

  /**
   * Login User given username and password. If success, store auth token in LocalStorage.
   * @param  {String} username User's username
   * @param  {String} password User's password
   * @return {Promise}         Token wrapped in a Promise
   */
  static login(username, password) {
    const hash = `Basic ${btoa(`${username}:${password}`)}`;

    return auth(`${API}auth`, hash).get().then((result) => {
      localStorageService.setItem(authStorage, hash);
      return result;
    });
  }

  /**
   * Logout User by removing User's token.
   * @return {Promise} Resolved promise
   */
  static logout() {
    localStorageService.removeItem(authStorage);
    return Promise.resolve();
  }

  /**
   * Docker's daemon information.
   * @return {Promise} Information of daemon
   */
  static info() {
    return auth(`${API}info`).get();
  }

  /**
   * List Docker's containers.
   * @return {Promise} Array of informations wrapped in a Promise
   */
  static containers() {
    return auth(`${API}containers`).get().then(({ results }) => results);
  }

  /**
   * Retrieve informations about a Docker's container.
   * @param  {String} containerId Container's id
   * @return {Promise}            Information wrapped in a Promise
   */
  static containerInfos(containerId) {
    return auth(`${API}containers/${containerId}/`).get();
  }

  /**
   * Create Docker's container from Docker Compose file.
   * @param  {String} name        Name of the stack
   * @param  {String} composeFile Docker Compose file content
   * @return {Promise}            Array of created containers wrapped in a Promise
   */
  static containerCreate(name, composeFile) {
    return auth(`${API}containers/${name}/`).post(composeFile);
  }

  /**
   * Start Docker's container.
   * @param  {String} containerId Container's id
   * @return {Promise}            Resolved promise
   */
  static containerStart(containerId) {
    return auth(`${API}containers/${containerId}/start`).post();
  }

  /**
   * Stop Docker's container.
   * @param  {String} containerId Container's id
   * @return {Promise}            Resolved promise
   */
  static containerStop(containerId) {
    return auth(`${API}containers/${containerId}/stop`).post();
  }

  /**
   * Restart Docker's container.
   * @param  {String} containerId Container's id
   * @return {Promise}            Resolved promise
   */
  static containerRestart(containerId) {
    return auth(`${API}containers/${containerId}/restart`).post();
  }

  /**
   * Delete Docker's container.
   * @param  {String} containerId Container's id
   * @return {Promise}            Resolved promise
   */
  static containerDelete(containerId) {
    return auth(`${API}containers/${containerId}/`).delete();
  }

  /**
   * Open WebSocket with auth token for connecting to two-way bus.
   * @param  {Function} onMessage Callback for each input receive from socket
   * @return {Websocket}          Opened and authentified Websocket
   */
  static streamBus(onMessage) {
    const socket = new WebSocket(`${WS}bus`);

    socket.onmessage = event => onMessage(event.data);
    socket.onopen = () => socket.send(localStorageService.getItem(authStorage));

    return socket;
  }

  /**
   * List Docker's Swarm services.
   * @return {Promise} Array of informations wrapped in a Promise
   */
  static services() {
    return auth(`${API}services`).get().then(({ results }) => results);
  }
}

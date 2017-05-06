import funtch, { errorHandler } from 'funtch';
import btoa from '../Tools/btoa';
import localStorageService from './LocalStorageService';

const API_HOST = process.env.API_HOST || 'localhost';
const API = `https://${API_HOST}/`;
const WS = `wss://${API_HOST}/ws/`;

/**
 * Storage key name for authentification token.
 */
export const authStorage = 'auth';

function customError(response) {
  return new Promise((resolve, reject) => {
    const funtchResponse = errorHandler(response);
    if (funtchResponse instanceof Promise) {
      return funtchResponse.catch(err =>
        reject({
          ...err,
          toString: () => {
            if (typeof err.content === 'string') {
              return err.content;
            }
            return JSON.stringify(err.content);
          },
        }),
      );
    }
    return resolve(funtchResponse);
  });
}

/**
 * Generate FetchBuilder for given URL with auth and error handler.
 * @param  {String} url   Wanted URL
 * @return {FetchBuilder} FetchBuilder pre-configured
 */
function auth(url) {
  return funtch.url(url).auth(localStorageService.getItem(authStorage)).error(customError);
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

    return funtch.url(`${API}auth`).auth(hash).get().then((result) => {
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
  static infos(containerId) {
    return auth(`${API}containers/${containerId}/`).get();
  }

  /**
   * Create Docker's container from Docker Compose file.
   * @param  {String} name        Name of the stack
   * @param  {String} composeFile Docker Compose file content
   * @return {Promise}            Array of created containers wrapped in a Promise
   */
  static create(name, composeFile) {
    return auth(`${API}containers/${name}/`).post(composeFile);
  }

  /**
   * Start Docker's container.
   * @param  {String} containerId Container's id
   * @return {Promise}            Resolved promise
   */
  static start(containerId) {
    return auth(`${API}containers/${containerId}/start`).post();
  }

  /**
   * Stop Docker's container.
   * @param  {String} containerId Container's id
   * @return {Promise}            Resolved promise
   */
  static stop(containerId) {
    return auth(`${API}containers/${containerId}/stop`).post();
  }

  /**
   * Restart Docker's container.
   * @param  {String} containerId Container's id
   * @return {Promise}            Resolved promise
   */
  static restart(containerId) {
    return auth(`${API}containers/${containerId}/restart`).post();
  }

  /**
   * Delete Docker's container.
   * @param  {String} containerId Container's id
   * @return {Promise}            Resolved promise
   */
  static delete(containerId) {
    return auth(`${API}containers/${containerId}/`).delete();
  }

  /**
   * Open WebSocket with auth token for reading logs of a Docker's container.
   * @param  {String} containerId Container's id
   * @param  {Function} onMessage Callback for each input receive from socket
   * @return {Websocket}          Opened and authentified Websocket
   */
  static logs(containerId, onMessage) {
    const socket = new WebSocket(`${WS}containers/${containerId}/logs`);

    socket.onmessage = event => onMessage(event.data);
    socket.onopen = () => socket.send(localStorageService.getItem(authStorage));

    return socket;
  }

  /**
   * Open WebSocket with auth token for reading events of a Docker's daemon.
   * @param  {Function} onMessage Callback for each input event from socket
   * @return {Websocket}          Opened and authentified Websocket
   */
  static events(onMessage) {
    const socket = new WebSocket(`${WS}events`);

    socket.onmessage = event => onMessage(event.data);
    socket.onopen = () => socket.send(localStorageService.getItem(authStorage));

    return socket;
  }
}

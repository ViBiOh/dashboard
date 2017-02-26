import { browserHistory } from 'react-router';
import Fetch, { errorHandler } from 'js-fetch';
import btoa from '../Tools/btoa';
import localStorageService from './LocalStorageService';

const API_HOST = 'docker-api.vibioh.fr';
const API = `https://${API_HOST}/`;
export const authStorage = 'auth';

function authRedirect(response) {
  if (response.status === 401) {
    browserHistory.push('/login');
  }
  return errorHandler(response);
}

function auth(url) {
  return Fetch.url(url)
    .auth(localStorageService.getItem(authStorage))
    .error(authRedirect);
}

export default class DockerService {
  static isLogged() {
    return !!localStorageService.getItem(authStorage);
  }

  static login(username, password) {
    const hash = `Basic ${btoa(`${username}:${password}`)}`;

    return Fetch.url(`${API}auth`).auth(hash).get()
      .then((result) => {
        localStorageService.setItem(authStorage, hash);
        return result;
      });
  }

  static logout() {
    localStorageService.removeItem(authStorage);
    return Promise.resolve();
  }

  static containers() {
    return auth(`${API}containers`)
      .get()
      .then(({ results }) => results);
  }


  static infos(containerId) {
    return auth(`${API}containers/${containerId}/`)
      .get();
  }

  static create(name, composeFile) {
    return auth(`${API}containers/${name}/`)
      .post(composeFile);
  }

  static start(containerId) {
    return auth(`${API}containers/${containerId}/start`)
      .post();
  }

  static stop(containerId) {
    return auth(`${API}containers/${containerId}/stop`)
      .post();
  }

  static restart(containerId) {
    return auth(`${API}containers/${containerId}/restart`)
      .post();
  }

  static delete(containerId) {
    return auth(`${API}containers/${containerId}/`).delete();
  }

  static logs(containerId, onMessage) {
    const socket = new WebSocket(`wss://${API_HOST}/ws/containers/${containerId}/logs`);

    socket.onmessage = event => onMessage(event.data);
    socket.onopen = () => socket.send(localStorageService.getItem(authStorage));

    return socket;
  }

  static events(onMessage) {
    const socket = new WebSocket(`wss://${API_HOST}/ws/events`);

    socket.onmessage = event => onMessage(event.data);
    socket.onopen = () => socket.send(localStorageService.getItem(authStorage));

    return socket;
  }
}

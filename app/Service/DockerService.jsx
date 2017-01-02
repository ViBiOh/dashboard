import { browserHistory } from 'react-router';
import Fetch, { errorHandler } from 'js-fetch';

const API = 'https://docker-api.vibioh.fr/';
const authStorage = 'auth';

function authRedirect(response) {
  if (response.status === 401) {
    browserHistory.push('/login');
  }
  return errorHandler(response);
}

function auth(url) {
  return Fetch.url(url)
    .auth(localStorage.getItem(authStorage))
    .error(authRedirect);
}

export default class DockerService {
  static isLogged() {
    return !!localStorage.getItem(authStorage);
  }

  static login(login, password) {
    const hash = `Basic ${btoa(`${login}:${password}`)}`;

    return Fetch.url(`${API}auth`)
      .auth(hash)
      .get()
      .then(() => {
        localStorage.setItem(authStorage, hash);
      });
  }

  static logout() {
    localStorage.removeItem(authStorage);
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

  static logs(containerId) {
    return auth(`${API}containers/${containerId}/logs`)
      .get()
      .then(({ results }) => results);
  }
}

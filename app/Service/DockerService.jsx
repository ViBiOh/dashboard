import Fetch from 'js-fetch';

const API = 'https://docker-api.vibioh.fr/';

export default class DockerService {
  static isLogged() {
    return !!localStorage.getItem('auth');
  }

  static login(login, password) {
    const hash = `Basic ${btoa(`${login}:${password}`)}`;

    return Fetch.url(`${API}auth`)
      .auth(hash)
      .get()
      .then(() => {
        localStorage.setItem('auth', hash);
      });
  }

  static containers() {
    return Fetch.url(`${API}containers`)
      .auth(localStorage.getItem('auth'))
      .get()
      .then(({ results }) => results);
  }

  static start(containerId) {
    return Fetch.url(`${API}containers/${containerId}/start`)
      .auth(localStorage.getItem('auth'))
      .post();
  }

  static stop(containerId) {
    return Fetch.url(`${API}containers/${containerId}/stop`)
      .auth(localStorage.getItem('auth'))
      .post();
  }

  static restart(containerId) {
    return Fetch.url(`${API}containers/${containerId}/restart`)
      .auth(localStorage.getItem('auth'))
      .post();
  }
}

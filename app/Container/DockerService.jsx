import Fetch from 'js-fetch';

const API = 'https://docker-api.vibioh.fr/';

let auth;

export default class DockerService {
  static login(login, password) {
    const hash = `Basic ${btoa(`${login}:${password}`)}`;

    return Fetch.url(`${API}auth`)
      .auth(hash)
      .get()
      .then(() => {
        auth = hash;
      });
  }

  static containers() {
    return Fetch.url(`${API}containers`)
      .auth(auth)
      .get()
      .then(({ results }) => results);
  }
}

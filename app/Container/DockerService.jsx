import Fetch from 'js-fetch';

const API = 'https://docker-api.vibioh.fr/';

export default class DockerService {
  static login(login, password) {
    const auth = `Basic ${btoa(`${login}:${password}`)}`;

    return Fetch.url(`${API}auth`)
      .auth(auth)
      .get();
  }

  static containers() {
    return Fetch.get(`${API}containers`)
      .then(({ results }) => results);
  }
}

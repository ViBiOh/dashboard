import Fetch from 'js-fetch';

export default class DockerService {
  static login(login, password) {
    const auth = btoa(`Basic ${login}:${password}`);

    return Fetch.url('https://docker-api.vibioh.fr/auth')
      .auth(auth)
      .get();
  }

  static containers() {
    return Fetch.get('https://docker-api.vibioh.fr/containers')
      .then(({ results }) => results);
  }
}

import Fetch from 'js-fetch';

export default class DockerService {
  static containers() {
    return Fetch.get('https://docker-api.vibioh.fr/containers')
      .then(({ results }) => results);
  }
}

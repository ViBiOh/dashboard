export default function (content) {
  const params = {};
  content.replace(/([^?&=]+)(?:=([^?&=]*))?/g, (match, key, value) => {
    // eslint-disable-next-line no-param-reassign
    params[key] = typeof value === 'undefined' ? true : decodeURIComponent(value);
  });
}

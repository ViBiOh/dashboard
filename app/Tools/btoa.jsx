export default typeof btoa !== 'undefined' ? btoa : str => Buffer(str, 'binary').toString('base64');

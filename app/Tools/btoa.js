/**
 * Binary to Alphanumeric (Base64 converter).
 * @param  {String} str String to convert
 * @return {String}     Base64 corresponding string
 */
export default typeof btoa !== 'undefined' ? btoa : str => Buffer(str, 'binary').toString('base64');

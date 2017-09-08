/**
 * Minimum length of words for trying to clean.
 */
const CLEAN_SEARCH_MIN_LENGTH = 1;

/**
 * Minimum length of words kept when cleaning.
 */
const CLEAN_WORDS_MIN_LENGTH = 2;

/**
 * Maximum clean search percentage when cleaning
 */
const CLEAN_SEARCH_PERCENTAGE = 0.5;

/**
 * Replace accented char in given string
 *
 * @param {String} str Given string
 * @return String with accented character replaced by raw one
 */
export function replaceAccentedChar(str) {
  if (typeof str === 'undefined' || str === null) {
    return '';
  }

  return String(str)
    .replace(/[\u00c0-\u00c5]/gm, 'A')
    .replace(/[\u00c6]/gm, 'AE')
    .replace(/[\u00c7]/gm, 'C')
    .replace(/[\u00c8-\u00cb]/gm, 'E')
    .replace(/[\u00cc-\u00cf]/gm, 'I')
    .replace(/[\u00d0]/gm, 'D')
    .replace(/[\u00d1]/gm, 'N')
    .replace(/[\u00d2-\u00d6]/gm, 'O')
    .replace(/[\u00d8]/gm, 'O')
    .replace(/[\u00d9-\u00dc]/gm, 'U')
    .replace(/[\u00dd]/gm, 'Y')
    .replace(/[\u00e0-\u00e5]/gm, 'a')
    .replace(/[\u00e6]/gm, 'ae')
    .replace(/[\u00e7]/gm, 'c')
    .replace(/[\u00e8-\u00eb]/gm, 'e')
    .replace(/[\u00ec-\u00ef]/gm, 'i')
    .replace(/[\u00f1]/gm, 'n')
    .replace(/[\u00f2-\u00f6]/gm, 'o')
    .replace(/[\u00f8]/gm, 'o')
    .replace(/[\u00f9-\u00fc]/gm, 'u')
    .replace(/[\u00fd]/gm, 'y')
    .replace(/[\u00ff]/gm, 'y')
    .replace(/[\u0152]/gm, 'OE')
    .replace(/[\u0153]/gm, 'oe');
}

/**
 * Clean search values by removing too short words if enough words
 *
 * @param {Array<String>} values Search values
 * @return Cleaned search values
 */
export function cleanSearchValues(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  if (values.length > CLEAN_SEARCH_MIN_LENGTH) {
    const filteredValues = values.filter(v => v.length > CLEAN_WORDS_MIN_LENGTH);
    if (filteredValues.length / values.length > CLEAN_SEARCH_PERCENTAGE) {
      return filteredValues;
    }
  }

  return values;
}

/**
 * Build full text regex for given string, splitting words, cleaning and
 * create a regex that behaves like a fulltext search.
 *
 * @param {String} value Search string
 * @returnRegExp Pattern for make a fulltext-like search from given search string
 */
export function buildFullTextRegex(value) {
  const wildcard = '[\\s\\S]*';
  const flags = 'gim';
  if (value.trim() === '') {
    return new RegExp(wildcard, flags);
  }

  const values = cleanSearchValues(
    replaceAccentedChar(value)
      .replace(/[\]/\\^$*+?.(){}|[-]/gim, ' ')
      .trim()
      .replace(/\s+/, ' ')
      .split(' '),
  );
  const textGroup = `(${values.join('|')})`;

  const parts = [wildcard];
  const excludes = [];

  for (let i = 0, size = values.length; i < size; i += 1) {
    if (i > 0) {
      excludes.push(`\\${i}`);
      parts.push(`(?!${excludes.join('|')})`);
    }
    parts.push(textGroup);
    parts.push(wildcard);
  }

  return new RegExp(parts.join(''), flags);
}

/**
 * Perform a fulltext search for given search and indicate if value matches or not
 *
 * @param {String} value tested for search matching
 * @param {string|RegExp} search Searched string or pattern
 * return True if value matches given search, false otherwise
 */
export function fullTextRegexFilter(value, search) {
  let regex = search;
  if (!(search instanceof RegExp)) {
    regex = buildFullTextRegex(search);
  }

  regex.lastIndex = 0;
  return regex.test(replaceAccentedChar(value));
}

/**
 * Flat values of given param (object/array).
 *
 * @param {any} o Values to flat
 * @return Array of flatted values
 */
export function flatValues(o) {
  if (typeof o === 'undefined' || o === null) {
    return [];
  }

  if (Array.isArray(o)) {
    return [].concat(...o.map(flatValues));
  }

  if (typeof o === 'object') {
    const values = Object.values(o).filter(e => typeof e !== 'function').map(flatValues);

    return [].concat(...values);
  }

  return [o];
}

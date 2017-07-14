const CLEAN_SEARCH_MIN_LENGTH = 2;
const CLEAN_WORDS_MIN_LENTH = 2;
const CLEAN_SEARCH_PERCENTAGE = 0.5;

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

export function cleanSearchValues(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  if (values.length > CLEAN_SEARCH_MIN_LENGTH) {
    const filteredValues = values.filter(v => v.length > CLEAN_WORDS_MIN_LENTH);
    if (filteredValues.length / values.length > CLEAN_SEARCH_PERCENTAGE) {
      return filteredValues;
    }
  }

  return values;
}

export function buildFullTextRegex(value) {
  const wildcard = '[\\s\\S]*';
  const flags = 'gimy';
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

export function fullTextRegexFilter(value, search) {
  let regex = search;
  if (!(search instanceof RegExp)) {
    regex = buildFullTextRegex(search);
  }

  regex.lastIndex = 0;
  return regex.test(replaceAccentedChar(value));
}

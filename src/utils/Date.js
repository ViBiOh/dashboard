import dateFns from 'date-fns';
import frLocale from 'date-fns/locale/fr';

/**
 * Format given date into given format
 * @param  {String} e String date
 * @param  {String} f Format
 * @return {String}   Formatted date
 */
export function format(e, f) {
  return dateFns.format(dateFns.parse(e), f, { locale: frLocale });
}

/**
 * Compute date from now
 * @param  {String} e String date
 * @return {String}   Formatted date from now
 */
export function fromNow(e) {
  return dateFns.distanceInWordsToNow(dateFns.parse(e));
}

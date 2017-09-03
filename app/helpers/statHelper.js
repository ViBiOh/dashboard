/**
 * Bytes size.
 * @type {Number}
 */
const BYTES_SIZE = 1024;

/**
 * Bytes names in human size.
 * @type {Array}
 */
export const BYTES_NAMES = ['Bytes', 'kB', 'MB', 'GB', 'TB'];

/**
 * Determine best human size scale for bytes size.
 * @param  {Number} size Bytes size
 * @return {Number} Human size scale best matching
 */
export const humanSizeScale = size =>
  Math.floor(Math.log(Math.max(size, 1)) / Math.log(BYTES_SIZE));

/**
 * Convert bytes size to the given scale.
 * @param  {Number} size  Bytes size
 * @param  {Number} scale Bytes size scale
 * @return {Number} Bytes size converted to the given scale
 */
export const scaleSize = (size, scale) => {
  const i = scale || humanSizeScale(size);

  // eslint-disable-next-line no-restricted-properties
  const rawSize = size / Math.pow(BYTES_SIZE, i);

  return parseInt(rawSize * 100, 10) / 100;
};

/**
 * Convert bytes size to human scale
 * @param  {Number} size  Bytes size
 * @param  {Number} scale Bytes size scale
 * @return {String} Human readable size
 */
export const humanSize = (size, scale = humanSizeScale(size)) =>
  `${scaleSize(size, scale)} ${BYTES_NAMES[scale]}`;

/**
 * Compute CPU maximum percentage for given stat (100% * number of CPU).
 * @param  {Object} stat Container's stat
 * @return {Number} Maximum CPU percentage
 */
export const cpuPercentageMax = stat => stat.cpu_stats.cpu_usage.percpu_usage.length * 100;

/**
 * Compute CPU percentage of containers.
 * @param  {Object} stat Container's stat
 * @return {Number}      CPU percentage
 */
export const computeCpuPercentage = (stat) => {
  const cpuDelta = stat.cpu_stats.cpu_usage.total_usage - stat.precpu_stats.cpu_usage.total_usage;
  const systemDelta = stat.cpu_stats.system_cpu_usage - stat.precpu_stats.system_cpu_usage;
  const ratio = cpuDelta / systemDelta;

  return parseInt(ratio * cpuPercentageMax(stat) * 100, 10) / 100;
};

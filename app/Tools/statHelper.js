const BYTES_SIZE = 1024;
const BYTES_NAMES = ['Bytes', 'kB', 'MB', 'GB', 'TB'];

/**
 * Compute size scale of given size.
 * @param  {int} size Bytes size
 * @return {int} Size scale
 */
export const humanSizeScale = size => Math.floor(Math.log(size) / Math.log(BYTES_SIZE));

/**
 * Convert bytes size to human readable size.
 * @param  {Number} size Bytes size
 * @param  {Number} precision Decimal count
 * @param  {Number} scale Human size scale
 * @return {string}   Human readable bytes size
 */
export const humanSize = (size, precision = 0, scale) => {
  const i = scale || humanSizeScale(size);
  // eslint-disable-next-line no-restricted-properties
  return `${(size / Math.pow(BYTES_SIZE, i)).toFixed(precision)} ${BYTES_NAMES[i]}`;
};

/**
 * Compute CPU maximum percentage for given stat (100% * number of CPU).
 * @param  {Object} stat Container's stat
 * @return {Number} Maximum CPU percentage
 */
export const cpuPercentageMax = stat => stat.cpu_stats.cpu_usage.percpu_usage.length * 100

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

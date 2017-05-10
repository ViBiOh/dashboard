const BYTES_SIZE = 1024;
const BYTES_NAMES = ['Bytes', 'kB', 'MB', 'GB', 'TB'];

/**
 * Convert bytes size to human readable size.
 * @param  {int} size Bytes size
 * @param  {int} precision Decimal count
 * @return {string}   Human readable bytes size
 */
export const humanSize = (size, precision = 0, scale) => {
  let i = scale;
  if (!scale) {
    i = Math.floor(Math.log(size) / Math.log(BYTES_SIZE));
  }
  // eslint-disable-next-line no-restricted-properties
  return `${(size / Math.pow(BYTES_SIZE, i)).toFixed(precision)} ${BYTES_NAMES[i]}`;
};

/**
 * Compute CPU percentage of containers.
 * @param  {Object} stat Container's stat
 * @return {Number}      CPU percentage
 */
export const computeCpuPercentage = (stat) => {
  const cpuDelta = stat.cpu_stats.cpu_usage.total_usage - stat.precpu_stats.cpu_usage.total_usage;
  const systemDelta = stat.cpu_stats.system_cpu_usage - stat.precpu_stats.system_cpu_usage;
  const ratio = cpuDelta / systemDelta;
  const cpuCoeff = stat.cpu_stats.cpu_usage.percpu_usage.length * 100;

  return parseInt(ratio * cpuCoeff * 100, 10) / 100;
};

import test from 'ava';
import {
  humanSizeScale,
  scaleSize,
  humanSize,
  cpuPercentageMax,
  computeCpuPercentage,
  BYTES_NAMES,
} from './statHelper';

const stat = {
  cpu_stats: {
    cpu_usage: {
      total_usage: 5,
      percpu_usage: [0, 1, 2, 3, 4, 5, 6, 7],
    },
    system_cpu_usage: 10,
  },
  precpu_stats: {
    cpu_usage: {
      total_usage: 1,
    },
    system_cpu_usage: 1,
  },
};

test('humanSizeScale with undefined value', t => t.true(isNaN(humanSizeScale(undefined))));

test('humanSizeScale with no value', t => t.is(humanSizeScale(0), 0));

test('humanSizeScale with 4kb', t => t.is(humanSizeScale(1024 * 1024 * 4), 2));

test('scaleSize with undefined values', t => t.true(isNaN(scaleSize())));

test('scaleSize with with no value', t => t.is(scaleSize(0), 0));

test('scaleSize', t => t.is(scaleSize(102400, 2), 0.09));

test('scaleSize with scale and precision', t => t.is(scaleSize(10240, 1, 0), 10));

test('humanSize', t => t.is(humanSize(102400, 2), `0.09 ${BYTES_NAMES[2]}`));

test('cpuPercentageMax', t => t.is(cpuPercentageMax(stat), 800));

test('computeCpuPercentage', t => t.is(computeCpuPercentage(stat), 355.55));

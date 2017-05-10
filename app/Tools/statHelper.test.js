import test from 'ava';
import {
  humanSizeScale,
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

test('humanSize', t => t.is(humanSizeScale(1024 * 1024 * 4), 2));

test('humanSize', t => t.is(humanSize(10240), `10 ${BYTES_NAMES[1]}`));
test('humanSize', t => t.is(humanSize(102400, 2, 2), `0.10 ${BYTES_NAMES[2]}`));

test('cpuPercentageMax', t => t.is(cpuPercentageMax(stat), 800));

test('computeCpuPercentage', t => t.is(computeCpuPercentage(stat), 355.55));

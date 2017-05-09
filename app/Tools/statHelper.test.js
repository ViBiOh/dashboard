import test from 'ava';
import { humanSize, computeCpuPercentage } from './statHelper';

test('humanSize', t => t.is(humanSize(1024), '1 kB'));

test('computeCpuPercentage', t =>
  t.is(
    computeCpuPercentage({
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
    }),
    355.55,
  ));

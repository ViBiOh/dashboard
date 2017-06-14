import test from 'ava';
import actions from '../actions';
import reducer, { STATS_COUNT } from './stats';

const stat = {
  read: '2017-05-13T13:18:55.001886639Z',
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
  memory_stats: {
    usage: 2564096,
    max_usage: 6361088,
    limit: 16777216,
  },
};

test('should have an empty default state', t =>
  t.deepEqual(reducer(undefined, {}), { entries: [] }));

test('should create empty array on OPEN_STATS', t =>
  t.deepEqual(reducer(undefined, { type: actions.OPEN_STATS }), { entries: [] }));

test('should create empty array on CLOSE_STATS', t =>
  t.deepEqual(reducer(undefined, { type: actions.CLOSE_STATS }), { entries: [] }));

test('should append given stats on ADD_STAT', t =>
  t.deepEqual(reducer({ entries: [] }, { type: actions.ADD_STAT, stat }), {
    cpuLimit: 800,
    entries: [
      {
        cpu: 355.55,
        memory: 2.44,
        ts: new Date(Date.parse('2017-05-13T13:18:55.001886639Z')),
      },
    ],
    memoryLimit: 16,
    memoryScale: 2,
    memoryScaleNames: 'MB',
  }));

test('should remove old element when STATS_COUNT is reached', (t) => {
  const entries = [];
  for (let i = 0; i < STATS_COUNT; i += 1) {
    entries.push({ id: i });
  }

  const result = reducer(
    { entries, cpuLimit: 800, memoryScale: 2 },
    { type: actions.ADD_STAT, stat },
  );

  t.falsy(result.entries.find(e => e.id === 0));
});

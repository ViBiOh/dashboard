import test from 'ava';
import React from 'react';
import { shallow } from 'enzyme';
import ContainerStats from './ContainerStats';

const stat = {
  memory_stats: {
    usage: 1216512,
    max_usage: 1523712,
    stats: {
      active_anon: 782336,
      active_file: 0,
      cache: 0,
      dirty: 0,
      hierarchical_memory_limit: 16777216,
      hierarchical_memsw_limit: 33554432,
      inactive_anon: 0,
      inactive_file: 0,
      mapped_file: 0,
      pgfault: 600,
      pgmajfault: 0,
      pgpgin: 477,
      pgpgout: 286,
      rss: 782336,
      rss_huge: 0,
      swap: 0,
      total_active_anon: 782336,
      total_active_file: 0,
      total_cache: 0,
      total_dirty: 0,
      total_inactive_anon: 0,
      total_inactive_file: 0,
      total_mapped_file: 0,
      total_pgfault: 600,
      total_pgmajfault: 0,
      total_pgpgin: 477,
      total_pgpgout: 286,
      total_rss: 782336,
      total_rss_huge: 0,
      total_swap: 0,
      total_unevictable: 0,
      total_writeback: 0,
      unevictable: 0,
      writeback: 0,
    },
    failcnt: 0,
    limit: 16777216,
  },
  cpu_stats: {
    cpu_usage: {
      total_usage: 52172401,
      percpu_usage: [0, 251690, 0, 43926916, 1636930, 1722564, 4583682, 50619],
      usage_in_kernelmode: 10000000,
      usage_in_usermode: 30000000,
    },
    system_cpu_usage: 8511472270000000,
    throttling_data: { periods: 0, throttled_periods: 0, throttled_time: 0 },
  },
  precpu_stats: {
    cpu_usage: {
      total_usage: 52210960,
      percpu_usage: [0, 251690, 0, 43926916, 1636930, 1761123, 4583682, 50619],
      usage_in_kernelmode: 10000000,
      usage_in_usermode: 30000000,
    },
    system_cpu_usage: 8511776040000000,
    throttling_data: { periods: 0, throttled_periods: 0, throttled_time: 0 },
  },
};

test('should not render if array is not provided', (t) => {
  const wrapper = shallow(<ContainerStats stats={null} />);

  t.is(wrapper.type(), null);
});

test('should display logs if given', (t) => {
  const wrapper = shallow(<ContainerStats stats={[stat]} />);

  t.is(wrapper.type(), 'span');
});

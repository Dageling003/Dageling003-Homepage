import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import TimeProgress from '../TimeProgress.vue';
import { useTimeProgress } from '../../composables/useTimeProgress';

vi.mock('../../composables/useTimeProgress', () => ({
  useTimeProgress: vi.fn(() => ({
    hoursPassedDisplay: '12.5',
    daysInWeekPassed: 3,
    daysInMonthPassed: 15,
    daysInYearPassed: 100,
    daysInCurrentMonth: 30,
    daysInCurrentYear: 365,
    hoursProgress: 52.08,
    weekProgress: 42.86,
    monthProgress: 50,
    yearProgress: 27.4,
  })),
}));

describe('TimeProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders time progress component', () => {
    const wrapper = mount(TimeProgress);
    expect(wrapper.find('.time-progress').exists()).toBe(true);
  });

  it('displays all four progress items', () => {
    const wrapper = mount(TimeProgress);
    const progressItems = wrapper.findAll('.progress-item');
    expect(progressItems.length).toBe(4);
  });

  it('displays daily progress correctly', () => {
    const wrapper = mount(TimeProgress);
    expect(wrapper.text()).toContain('今天已经过去了 12.5 / 24 小时');
  });

  it('displays weekly progress correctly', () => {
    const wrapper = mount(TimeProgress);
    expect(wrapper.text()).toContain('本周已经过去了 3 / 7 天');
  });

  it('displays monthly progress correctly', () => {
    const wrapper = mount(TimeProgress);
    expect(wrapper.text()).toContain('本月已经过去了 15 / 30 天');
  });

  it('displays yearly progress correctly', () => {
    const wrapper = mount(TimeProgress);
    expect(wrapper.text()).toContain('今年已经过去了 100 / 365 天');
  });

  it('renders progress bars with correct width', () => {
    const wrapper = mount(TimeProgress);
    const progressFills = wrapper.findAll('.progress-fill');
    expect(progressFills.length).toBe(4);
    expect(progressFills[0].attributes('style')).toContain('width: 52.08%');
  });

  it('calls useTimeProgress composable', () => {
    mount(TimeProgress);
    expect(useTimeProgress).toHaveBeenCalled();
  });
});

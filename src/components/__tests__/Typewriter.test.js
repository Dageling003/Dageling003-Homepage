import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Typewriter from '../Typewriter.vue';

describe('Typewriter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('renders with string prop', () => {
    const wrapper = mount(Typewriter, {
      props: {
        text: 'Hello World',
      },
    });

    expect(wrapper.text()).toBe('|');
  });

  it('renders with array prop', () => {
    const wrapper = mount(Typewriter, {
      props: {
        text: ['First line', 'Second line'],
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('has cursor element', () => {
    const wrapper = mount(Typewriter, {
      props: {
        text: 'Test',
      },
    });

    expect(wrapper.find('.cursor').exists()).toBe(true);
  });

  it('toggles cursor blink', async () => {
    const wrapper = mount(Typewriter, {
      props: {
        text: 'Test',
      },
    });

    expect(wrapper.find('.cursor').classes()).toContain('blink');

    vi.advanceTimersByTime(600);
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.cursor').classes()).not.toContain('blink');
  });
});

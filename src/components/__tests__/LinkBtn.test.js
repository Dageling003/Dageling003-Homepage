import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import LinkBtn from '../LinkBtn.vue';

vi.mock('@iconify/vue', () => ({
  Icon: {
    name: 'Icon',
    template: '<span></span>',
  },
}));

describe('LinkBtn', () => {
  it('renders correctly with default props', () => {
    const wrapper = mount(LinkBtn, {
      props: {
        text: 'Test Button',
        icon: 'mdi:github',
      },
    });

    expect(wrapper.text()).toContain('Test Button');
  });

  it('renders with custom color', () => {
    const wrapper = mount(LinkBtn, {
      props: {
        text: 'Colored Button',
        color: '#ff0000',
      },
    });

    const link = wrapper.find('a');
    expect(link.attributes('style')).toMatch(/background:\s*rgb\(255,\s*0,\s*0\)/);
  });

  it('renders with url', () => {
    const wrapper = mount(LinkBtn, {
      props: {
        text: 'Link Button',
        url: 'https://example.com',
      },
    });

    const link = wrapper.find('a');
    expect(link.attributes('href')).toBe('https://example.com');
    expect(link.attributes('target')).toBe('_blank');
  });

  it('handles keyboard events', async () => {
    const openMock = vi.fn();
    const originalOpen = window.open;
    window.open = openMock;

    const wrapper = mount(LinkBtn, {
      props: {
        text: 'Keyboard Button',
        url: 'https://example.com',
      },
    });

    const link = wrapper.find('a');
    await link.trigger('keydown', { key: 'Enter' });

    expect(openMock).toHaveBeenCalled();

    window.open = originalOpen;
  });
});

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import TechStack from '../TechStack.vue';

describe('TechStack', () => {
  const mockTechStack = [
    { name: 'Vue', icon: 'logos:vue' },
    { name: 'React', icon: 'logos:react' },
    { name: 'JavaScript', icon: 'logos:javascript' },
  ];

  it('renders tech stack items correctly', () => {
    const wrapper = mount(TechStack, {
      props: {
        techStack: mockTechStack,
      },
    });

    const items = wrapper.findAll('.techItem');
    expect(items.length).toBe(3);
  });

  it('displays icons for each tech', () => {
    const wrapper = mount(TechStack, {
      props: {
        techStack: mockTechStack,
      },
    });

    const items = wrapper.findAll('.techItem');
    expect(items.length).toBe(3);
    expect(items[0].attributes('data-name')).toBe('Vue');
    expect(items[1].attributes('data-name')).toBe('React');
    expect(items[2].attributes('data-name')).toBe('JavaScript');
  });

  it('displays tech name on hover via data-name attribute', () => {
    const wrapper = mount(TechStack, {
      props: {
        techStack: mockTechStack,
      },
    });

    const items = wrapper.findAll('.techItem');
    expect(items[0].attributes('data-name')).toBe('Vue');
    expect(items[1].attributes('data-name')).toBe('React');
    expect(items[2].attributes('data-name')).toBe('JavaScript');
  });

  it('handles empty tech stack', () => {
    const wrapper = mount(TechStack, {
      props: {
        techStack: [],
      },
    });

    const items = wrapper.findAll('.techItem');
    expect(items.length).toBe(0);
  });

  it('applies correct default props', () => {
    const wrapper = mount(TechStack);
    expect(wrapper.props('techStack')).toEqual([]);
  });
});

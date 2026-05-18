import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ProfileCard from '../ProfileCard.vue';

describe('ProfileCard', () => {
  const mockConfig = {
    name: 'Dageling003',
    age: '2000',
    zodiac: '龙',
    professions: ['前端工程师', '全栈开发者'],
  };

  const mockTechStack = [
    { name: 'Vue', icon: 'logos:vue' },
    { name: 'JavaScript', icon: 'logos:javascript' },
  ];

  it('renders profile card correctly', () => {
    const wrapper = mount(ProfileCard, {
      props: {
        config: mockConfig,
        techStack: mockTechStack,
      },
    });

    expect(wrapper.find('.profileCard').exists()).toBe(true);
  });

  it('displays user name correctly', () => {
    const wrapper = mount(ProfileCard, {
      props: {
        config: mockConfig,
        techStack: mockTechStack,
      },
    });

    expect(wrapper.text()).toContain('我叫 Dageling003');
  });

  it('displays age and zodiac correctly', () => {
    const wrapper = mount(ProfileCard, {
      props: {
        config: mockConfig,
        techStack: mockTechStack,
      },
    });

    expect(wrapper.text()).toContain('2000');
    expect(wrapper.text()).toContain('龙');
  });

  it('displays all professions', () => {
    const wrapper = mount(ProfileCard, {
      props: {
        config: mockConfig,
        techStack: mockTechStack,
      },
    });

    expect(wrapper.text()).toContain('前端工程师');
    expect(wrapper.text()).toContain('全栈开发者');
  });

  it('renders TechStack component with correct props', () => {
    const wrapper = mount(ProfileCard, {
      props: {
        config: mockConfig,
        techStack: mockTechStack,
      },
    });

    const techStack = wrapper.findComponent({ name: 'TechStack' });
    expect(techStack.exists()).toBe(true);
    expect(techStack.props('techStack')).toEqual(mockTechStack);
  });

  it('handles empty professions array', () => {
    const configWithoutProfessions = {
      ...mockConfig,
      professions: [],
    };

    const wrapper = mount(ProfileCard, {
      props: {
        config: configWithoutProfessions,
        techStack: mockTechStack,
      },
    });

    expect(wrapper.text()).toContain('是一名');
  });

  it('applies correct default props', () => {
    const wrapper = mount(ProfileCard, {
      props: {
        config: mockConfig,
      },
    });

    expect(wrapper.props('techStack')).toEqual([]);
  });
});

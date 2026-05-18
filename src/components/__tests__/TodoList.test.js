import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import TodoList from '../TodoList.vue';

describe('TodoList', () => {
  const mockTodoList = [
    { text: '完成任务 1', checked: true },
    { text: '完成任务 2', checked: false },
    { text: '完成任务 3', checked: false },
  ];

  it('renders todo items correctly', () => {
    const wrapper = mount(TodoList, {
      props: {
        todoList: mockTodoList,
      },
    });

    const items = wrapper.findAll('.todoItem');
    expect(items.length).toBe(3);
  });

  it('displays checked items with strikethrough', () => {
    const wrapper = mount(TodoList, {
      props: {
        todoList: mockTodoList,
      },
    });

    const items = wrapper.findAll('.todoItem');
    expect(items[0].find('del').exists()).toBe(true);
    expect(items[0].find('del').text()).toBe('完成任务 1');
  });

  it('displays unchecked items normally', () => {
    const wrapper = mount(TodoList, {
      props: {
        todoList: mockTodoList,
      },
    });

    const items = wrapper.findAll('.todoItem');
    expect(items[1].find('del').exists()).toBe(false);
    expect(items[1].text()).toContain('完成任务 2');
  });

  it('displays correct icons based on checked status', () => {
    const wrapper = mount(TodoList, {
      props: {
        todoList: mockTodoList,
      },
    });

    const items = wrapper.findAll('.todoItem');
    expect(items.length).toBe(3);
    expect(items[0].find('del').exists()).toBe(true);
    expect(items[1].find('del').exists()).toBe(false);
  });

  it('handles empty todo list', () => {
    const wrapper = mount(TodoList, {
      props: {
        todoList: [],
      },
    });

    const items = wrapper.findAll('.todoItem');
    expect(items.length).toBe(0);
  });
});

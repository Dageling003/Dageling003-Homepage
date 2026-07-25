import { assertConfigValueShape } from './config-value.validators';

/**
 * BUG-006 回归：links / techs / todos / typewriterWords / professions
 * 必须是合法 JSON 且 shape 符合预期，脏数据要在入库前被拦下。
 */
describe('assertConfigValueShape', () => {
  it('accepts valid links array', () => {
    const json = JSON.stringify([
      { text: '博客', url: 'https://example.com', color: '#f00' },
      { text: 'GitHub', url: 'https://github.com' },
    ]);
    expect(() => assertConfigValueShape('links', json)).not.toThrow();
  });

  it('rejects link with missing url', () => {
    const bad = JSON.stringify([{ text: '博客' }]);
    expect(() => assertConfigValueShape('links', bad)).toThrow();
  });

  it('rejects non-JSON string for known key', () => {
    expect(() => assertConfigValueShape('links', 'not json')).toThrow();
  });

  it('rejects non-array for links', () => {
    const bad = JSON.stringify({ text: 'x', url: 'y' });
    expect(() => assertConfigValueShape('links', bad)).toThrow();
  });

  it('accepts valid techs array', () => {
    const json = JSON.stringify([{ name: 'Vue' }, { name: 'TS' }]);
    expect(() => assertConfigValueShape('techs', json)).not.toThrow();
  });

  it('rejects tech without name', () => {
    const bad = JSON.stringify([{ name: '' }]);
    expect(() => assertConfigValueShape('techs', bad)).toThrow();
  });

  it('accepts valid todos array', () => {
    const json = JSON.stringify([
      { text: 'a', done: false },
      { text: 'b', done: true },
    ]);
    expect(() => assertConfigValueShape('todos', json)).not.toThrow();
  });

  it('rejects todo missing done boolean', () => {
    const bad = JSON.stringify([{ text: 'a', done: 'yes' }]);
    expect(() => assertConfigValueShape('todos', bad)).toThrow();
  });

  it('accepts string array for typewriterWords and professions', () => {
    const json = JSON.stringify(['a', 'b', 'c']);
    expect(() => assertConfigValueShape('typewriterWords', json)).not.toThrow();
    expect(() => assertConfigValueShape('professions', json)).not.toThrow();
  });

  it('rejects mixed array for professions', () => {
    const bad = JSON.stringify(['a', 42]);
    expect(() => assertConfigValueShape('professions', bad)).toThrow();
  });

  it('passes through unknown key (free-form string is allowed)', () => {
    expect(() =>
      assertConfigValueShape('name', 'literally anything'),
    ).not.toThrow();
    expect(() => assertConfigValueShape('unknownKey', '{{{')).not.toThrow();
  });

  it('is a no-op when configValue is undefined', () => {
    expect(() =>
      assertConfigValueShape('links', undefined as unknown as string),
    ).not.toThrow();
  });
});

/**
 * BUG-006 修复：对已知需要 JSON 结构的 config key 做结构校验。
 *
 * 现状：SiteConfig 用键值对 + JSON 字符串（configValue 列是 text），
 * 后端仅校验字符串本身合法，任何脏 JSON（比如 `[{}]` 或 `"boom"`）都能
 * 入库，前端 JSON.parse 后拿到不符合预期的 shape 直接白屏。
 *
 * 完整方案是把 configValue 改成 json 列 + 按类型拆表，跨端改动量大；
 * 这里先做**入口校验**：只有 configValue 能被解析成对应 schema 时才允许
 * 写入 —— 从根源阻断脏数据。前端消费侧的容错另行加强。
 */

interface LinkItem {
  text: string;
  url: string;
  color?: string;
}
interface TechItem {
  name: string;
}
interface TodoItem {
  text: string;
  done: boolean;
}

const NON_EMPTY_STRING = (v: unknown): v is string =>
  typeof v === 'string' && v.trim().length > 0;

const isLinkItem = (x: unknown): x is LinkItem => {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  if (!NON_EMPTY_STRING(o.text)) return false;
  if (!NON_EMPTY_STRING(o.url)) return false;
  if (o.color !== undefined && typeof o.color !== 'string') return false;
  return true;
};

const isTechItem = (x: unknown): x is TechItem => {
  if (!x || typeof x !== 'object') return false;
  return NON_EMPTY_STRING((x as Record<string, unknown>).name);
};

const isTodoItem = (x: unknown): x is TodoItem => {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return NON_EMPTY_STRING(o.text) && typeof o.done === 'boolean';
};

const isStringArray = (arr: unknown): arr is string[] =>
  Array.isArray(arr) && arr.every((x) => typeof x === 'string');

const isArrayOf = <T>(
  arr: unknown,
  guard: (x: unknown) => x is T,
): arr is T[] => Array.isArray(arr) && arr.every(guard);

// 已知需要 JSON 结构的 key → 校验函数。未列出的 key 保持自由字符串。
const SCHEMA_MAP: Record<string, (parsed: unknown) => boolean> = {
  links: (v) => isArrayOf(v, isLinkItem),
  techs: (v) => isArrayOf(v, isTechItem),
  todos: (v) => isArrayOf(v, isTodoItem),
  typewriterWords: (v) => isStringArray(v),
  professions: (v) => isStringArray(v),
};

/**
 * 若 configKey 需要 JSON 结构，则校验 configValue 是合法 JSON 且符合 shape。
 * 校验失败抛异常字符串（由 controller 层转成 BadRequestException）。
 * 非 JSON key 直接放行。
 */
export function assertConfigValueShape(
  configKey: string,
  configValue: string | undefined,
): void {
  if (configValue === undefined) return;
  const validator = SCHEMA_MAP[configKey];
  if (!validator) return; // 非 JSON key，跳过

  let parsed: unknown;
  try {
    parsed = JSON.parse(configValue);
  } catch {
    throw new Error(
      `配置项 '${configKey}' 必须是合法 JSON 字符串（当前无法 parse）`,
    );
  }
  if (!validator(parsed)) {
    throw new Error(`配置项 '${configKey}' 结构不符合要求，请检查每一项字段。`);
  }
}

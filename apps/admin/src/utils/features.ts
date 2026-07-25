/**
 * Feature toggles (front-end mirror of backend env flags).
 *
 * 通过 Vite 构建时环境变量控制，用户在 `apps/admin/.env` 里改开关：
 *   VITE_AUDIT_ENABLED=false          审计日志菜单/仪表盘活动区
 *   VITE_PASSWORD_RESET_ENABLED=false 登录页的「忘记密码」入口
 *
 * 默认都关闭。想开启的高级用户显式改为 true。
 */

function readFlag(name: string, defaultValue = false): boolean {
  const raw = (import.meta.env as Record<string, string | boolean | undefined>)[name]
  if (raw === undefined || raw === null || raw === '') return defaultValue
  if (raw === true || raw === 'true' || raw === '1') return true
  if (raw === false || raw === 'false' || raw === '0') return false
  return defaultValue
}

export function isAuditEnabled(): boolean {
  return readFlag('VITE_AUDIT_ENABLED', false)
}

export function isPasswordResetEnabled(): boolean {
  return readFlag('VITE_PASSWORD_RESET_ENABLED', false)
}

/** 单条操作日志 */
export interface ActivityItem {
  action: string
  entityKey: string
  operator: string
  createdAt: string
}

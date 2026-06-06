import type { TableColumnType } from 'ant-design-vue'

/** 单条配置项 */
export interface ConfigItem {
  id: number
  configKey: string
  configValue: string
  category?: string
  updatedAt: string
  createdAt?: string
}

/** 表格列定义 */
export const CONFIG_COLUMNS: TableColumnType<ConfigItem>[] = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
  { title: '配置键', dataIndex: 'configKey', key: 'configKey', width: 180 },
  { title: '分类', key: 'category', width: 100 },
  { title: '配置值', dataIndex: 'configValue', key: 'configValue', ellipsis: true },
  { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 180 },
  { title: '操作', key: 'actions', width: 200 },
]

/** 表单模式 */
export type FormMode = 'create' | 'edit'

/** 表单数据 */
export interface ConfigFormData {
  key: string
  value: string
  category: string
}

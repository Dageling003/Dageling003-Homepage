import axios from 'axios'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// Config API
export function getConfig(key: string) {
  return request.get<{ data: { configKey: string; configValue: string } }>(`/config/${key}`)
}

export function getAllConfigs() {
  return request.get<{ data: Array<{ configKey: string; configValue: string }> }>('/config')
}

export default request

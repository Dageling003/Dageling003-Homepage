// homepage site configuration types
export interface SiteConfig {
  id: number
  configKey: string
  configValue: string
  updatedAt: string
}

export interface SiteConfigMap {
  [key: string]: string
}

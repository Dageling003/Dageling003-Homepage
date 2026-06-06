/** 前台可控配置字段定义 */
export const FIELD_DEFS: Record<string, {
  label: string
  section: string
  desc: string
  example: string
  jsonType?: string
  frontendLocation: string
  configKey?: string
}> = {
  name:           { label: '昵称',       section: 'info',  desc: '头部大标题 "Hi, I\'m ___"',          example: '鹊楠',          frontendLocation: '头部标题' },
  zodiac:         { label: '星座',       section: 'info',  desc: '自我介绍括号中的星座',                 example: '摩羯座',        frontendLocation: '自我介绍' },
  infoSex:        { label: '性别',       section: 'info',  desc: '标签栏第一项，♂ 或 ♀',               example: '♂',           frontendLocation: '标签栏' },
  infoProvince:   { label: '省份',       section: 'info',  desc: '标签栏第二项',                       example: '江苏',          frontendLocation: '标签栏' },
  infoSchool:     { label: '学校',       section: 'info',  desc: '标签栏第三项',                       example: '南通大学',       frontendLocation: '标签栏' },
  avatarUrl:      { label: '头像 URL',   section: 'info',  desc: '左侧圆形头像图片地址',                  example: 'https://api.dicebear.com/7.x/thumbs/svg?seed=cat', frontendLocation: '头像' },
  professions:    { label: '职业标签',    section: 'info',  desc: '"我是一名 ___" 后的标签列表',           example: '["前端切图仔","摄影爱好者","猫猫教"]', jsonType: 'json-array', frontendLocation: '自我介绍' },
  links:          { label: '快捷链接',    section: 'links', desc: '主页底部的社交按钮（博客/GitHub/B站/邮箱）', example: '[{"text":"GitHub","url":"https://github.com","color":"#333"}]', jsonType: 'json-links', frontendLocation: '社交链接区' },
  techs:          { label: '技术栈',      section: 'techs', desc: '技术栈方块，每个 {name} 对应一个彩色图标',  example: '[{"name":"Vue"},{"name":"HTML"},{"name":"CSS"}]', jsonType: 'json-techs', frontendLocation: '自我介绍 → 技术栈区域' },
  todos:          { label: '待办事项',    section: 'todos', desc: '"我的一些鸽子计划" 列表',              example: '[{"text":"学Java","done":false},{"text":"回顾首页","done":true}]', jsonType: 'json-todos', frontendLocation: '左侧 Todo 卡片' },
  typewriterWords:{ label: '打字机文字',  section: 'todos', desc: '打字机效果轮播的文字列表',               example: '["欢迎来到我的主页 🎉","累了就休息一下吧~ 😊"]', jsonType: 'json-array', frontendLocation: '右侧打字机卡片' },
}

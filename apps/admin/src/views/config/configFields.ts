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
  siteTitle:      { label: '网站标题',   section: 'info',  desc: '浏览器标签页显示的网站标题',            example: '鹊楠的个人主页', frontendLocation: '浏览器标签页' },
  name:           { label: '昵称',       section: 'info',  desc: '头部大标题 "Hi, I\'m ___"',          example: '鹊楠',          frontendLocation: '头部标题' },
  infoSex:        { label: '性别',       section: 'info',  desc: '标签栏第一项，选择 男♂ 或 女♀',          example: '♂',           frontendLocation: '标签栏' },
  infoSexDisplay: { label: '性别展示',   section: 'info',  desc: '前台标签栏显示格式：symbol(仅符号) / text(仅文字) / both(符号+文字)', example: 'symbol', frontendLocation: '标签栏' },
  infoBirth:      { label: '出生日期',   section: 'info',  desc: '只需填写此项，年龄和星座自动计算',        example: '2001-06-15',  frontendLocation: '标签栏 / 自我介绍' },
  infoProvince:   { label: '省份',       section: 'info',  desc: '标签栏第三项，从34个省级行政区中选择',    example: '江苏省',       frontendLocation: '标签栏' },
  infoSchool:     { label: '学校',       section: 'info',  desc: '标签栏第四项。搜索数据源于教育部承认的全国高等学校名单（截至2024年6月20日）', example: '南通大学', frontendLocation: '标签栏' },
  avatarUrl:      { label: '头像 URL',   section: 'info',  desc: '左侧圆形头像图片地址',                  example: 'https://api.dicebear.com/7.x/thumbs/svg?seed=cat', frontendLocation: '头像' },
  professions:    { label: '职业标签',    section: 'info',  desc: '"我是一名 ___" 后的标签列表',           example: '["前端切图仔","摄影爱好者","猫猫教"]', jsonType: 'json-array', frontendLocation: '自我介绍' },
  infoShowName:   { label: '展示姓名',   section: 'info',  desc: '前台是否展示"我叫 xxx"',                example: '1',           frontendLocation: '自我介绍' },
  infoShowZodiac: { label: '展示星座',   section: 'info',  desc: '自我介绍中是否展示"（双子座）"（来自出生日期自动计算）', example: '1', frontendLocation: '自我介绍' },
  infoAgeDisplay: { label: '年龄展示',   section: 'info',  desc: '年龄显示位置：all(自我介绍+标签栏) / intro(仅自我介绍) / tag(仅标签栏) / hide(隐藏)', example: 'all', frontendLocation: '标签栏 / 自我介绍' },
  infoShowBirth:  { label: '展示出生日期',section: 'info',  desc: '前台标签栏是否展示"2001/06/15"',        example: '1',           frontendLocation: '标签栏' },
  links:          { label: '快捷链接',    section: 'links', desc: '主页底部的社交按钮（博客/GitHub/B站/邮箱）', example: '[{"text":"GitHub","url":"https://github.com","color":"#333"}]', jsonType: 'json-links', frontendLocation: '社交链接区' },
  techs:          { label: '技术栈',      section: 'techs', desc: '技术栈方块，每个 {name} 对应一个彩色图标',  example: '[{"name":"Vue"},{"name":"HTML"},{"name":"CSS"}]', jsonType: 'json-techs', frontendLocation: '自我介绍 → 技术栈区域' },
  todos:          { label: '待办事项',    section: 'todos', desc: '"我的一些鸽子计划" 列表',              example: '[{"text":"学Java","done":false},{"text":"回顾首页","done":true}]', jsonType: 'json-todos', frontendLocation: '左侧 Todo 卡片' },
  typewriterWords:{ label: '打字机文字',  section: 'todos', desc: '打字机效果轮播的文字列表',               example: '["欢迎来到我的主页 🎉","累了就休息一下吧~ 😊"]', jsonType: 'json-array', frontendLocation: '右侧打字机卡片' },
}

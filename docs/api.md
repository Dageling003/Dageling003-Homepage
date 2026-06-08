# API 接口文档

> 运行时可通过 Swagger UI 交互查看（仅非生产环境）：http://localhost:8000/api/docs
>
> 最后更新：2026/06/08 v0.7.0

---

## 一、认证模块

### POST /api/auth/login

管理员登录，获取 JWT Token。

**请求体：**

```json
{
  "username": "admin",
  "password": "admin123456"
}
```

**成功响应（200）：**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "username": "admin"
}
```

**错误响应（401）：**

```json
{
  "message": "用户名或密码错误",
  "error": "Unauthorized",
  "statusCode": 401
}
```

---

### POST /api/auth/forgot-password

申请密码重置。生成一次性 token；配置 SMTP 时发邮件，未配置时写入 `docker logs homepage-app`。

**请求体：**

```json
{ "username": "admin" }
```

**响应（200）：**

```json
{
  "message": "如果该用户存在，重置链接已发送（请同时检查垃圾邮件）",
  "smtpEnabled": true
}
```

未配置 SMTP 时额外返回 `devHint` 字段，提示从日志获取。

---

### POST /api/auth/reset-password

使用重置 token 设置新密码。

**请求体：**

```json
{
  "token": "从邮件/日志中拿到的一次性 token",
  "newPassword": "新密码（至少 12 位）"
}
```

**响应（200）：** `{ "message": "密码重置成功，请使用新密码登录" }`

**错误响应（400）：** token 无效 / 已过期 / 已被使用

---

### GET /api/auth/has-users

系统是否已存在任意用户（公开）。前端用于决定是否进入「创建管理员」流程。

**响应（200）：** `{ "data": { "hasUsers": false } }`

---

### POST /api/auth/create-first-admin

创建第一个管理员账号。**仅当 users 表为空时可用**。

**请求体：**

```json
{
  "username": "admin",
  "password": "你的强密码（≥ 12 位）"
}
```

**响应（200）：** `{ "message": "管理员账号已创建", "username": "admin" }`

**错误响应（409）：** `{ "message": "系统已存在管理员账号..." }`

---

### GET /api/auth/profile

获取当前登录用户信息（需 Bearer Token）。

**请求头：** `Authorization: Bearer <token>`

**成功响应（200）：**

```json
{
  "id": 1,
  "username": "admin",
  "role": "admin",
  "avatarUrl": "/files/uploads/avatar/xxx.webp",
  "theme": "light",
  "createdAt": "2026-06-06T...",
  "updatedAt": "2026-06-06T..."
}
```

---

### PUT /api/auth/profile

更新个人资料（需登录）。

**请求体：**

```json
{
  "avatarUrl": "/files/uploads/avatar/xxx.webp"
}
```

**响应（200）：** 返回更新后的用户信息（不含密码）

---

### PUT /api/auth/change-password

修改密码（需登录）。新密码至少 12 位。

**请求体：**

```json
{
  "oldPassword": "old-password",
  "newPassword": "new-strong-password-at-least-12-chars"
}
```

**响应（200）：**

```json
{
  "message": "密码修改成功"
}
```

**错误（400）：** 旧密码不正确 / 新旧密码相同 / 新密码不足 12 位

---

## 二、站点配置模块

### GET /api/config

获取所有配置项（公开接口）。

**响应（200）：**

```json
{
  "data": [
    {
      "id": 1,
      "configKey": "name",
      "configValue": "张三",
      "category": "info",
      "createdAt": "2026-06-06T...",
      "updatedAt": "2026-06-06T..."
    }
  ]
}
```

---

### GET /api/config/grouped

按分类分组获取所有配置（公开接口）。

**响应（200）：**

```json
{
  "data": {
    "info": [{ "configKey": "name", "configValue": "张三", ... }],
    "links": [...],
    "techs": [...],
    "todos": [...]
  }
}
```

---

### GET /api/config/category/:category

按分类筛选配置。

**示例：** `GET /api/config/category/info`

---

### GET /api/config/initialized

检查系统是否已完成初始化设置（公开接口）。

**响应（200）：**

```json
{
  "data": { "initialized": false }
}
```

> `_initialized = '0'` 或 key 不存在时返回 `false`，前端路由守卫据此跳转 `/setup`。

---

### GET /api/config/export/json

导出全部配置为 JSON 文件下载（需登录）。

**响应：** 文件下载，`Content-Disposition: attachment; filename="homepage-config.json"`

---

### GET /api/config/:key

按 key 获取单条配置（公开接口）。

**成功响应（200）：**

```json
{
  "data": {
    "id": 1,
    "configKey": "name",
    "configValue": "张三",
    ...
  }
}
```

**错误（404）：** 配置键不存在

---

### POST /api/config

新增配置项（需登录）。自动写入审计日志。

**请求体：**

```json
{
  "configKey": "newKey",
  "configValue": "value",
  "category": "info"
}
```

**响应（201）：** 返回新增的配置对象

**错误（409）：** 配置键已存在

---

### PUT /api/config/:key

更新配置项（需登录）。自动写入审计日志。

**请求体：**

```json
{
  "configKey": "name",
  "configValue": "新值",
  "category": "info"
}
```

**响应（200）：** 返回更新后的配置对象

---

### DELETE /api/config/:key

删除配置项（需登录）。自动写入审计日志。

**响应（200）：**

```json
{
  "message": "配置 'xxx' 已删除"
}
```

---

### POST /api/config/upload/avatar

上传头像图片（需登录，multipart/form-data）。

**参数：** `file` — 图片文件（jpg/png/gif/webp，≤5MB）

**处理流程：** multer 接收 → sharp 压缩为 200×200 WebP → 保存至 `public/uploads/avatar/`

**响应（200）：**

```json
{
  "data": { "url": "/files/uploads/avatar/avatar-1234567890-123456789.webp" }
}
```

---

## 三、系统

### GET /health

健康检查端点（始终可用，无需鉴权）。

**响应（200）：**

```json
{
  "status": "ok",
  "timestamp": "2026-06-08T..."
}
```

---

## 四、审计日志模块

### GET /api/audit

获取操作日志列表（需登录）。

**查询参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `page` | number | 页码，默认 1 |
| `limit` | number | 每页条数，默认 20 |
| `action` | string | 筛选操作类型（CREATE/UPDATE/DELETE） |
| `operator` | string | 筛选操作人 |
| `startDate` | string | 开始日期 |
| `endDate` | string | 结束日期 |

**响应（200）：**

```json
{
  "items": [
    {
      "id": 1,
      "action": "UPDATE",
      "entity": "site_config",
      "entityKey": "name",
      "detail": "{ \"before\": \"旧值\", \"after\": \"新值\" }",
      "operator": "admin",
      "createdAt": "2026-06-07T..."
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

---

## 五、错误码汇总

| 状态码 | 含义 | 常见原因 |
|--------|------|---------|
| 200 | 成功 | GET/PUT 请求成功 |
| 201 | 创建成功 | POST 请求成功 |
| 400 | 请求参数错误 | DTO 校验失败（密码太短、格式错误） |
| 401 | 未登录/Token过期 | 缺少或无效的 Bearer Token |
| 404 | 资源不存在 | 配置键不存在 / Swagger 生产环境禁用 |
| 409 | 资源冲突 | 配置键已存在 |
| 429 | 请求过于频繁 | 触发 rate limit（全局 120/min，登录 5/min） |
| 500 | 服务器内部错误 | 请查看后端日志 |

---

## 六、数据模型

### 配置分类

| 分类 | 说明 | 包含配置项 |
|------|------|-----------|
| `info` | 个人信息 | name, infoSex, infoSexDisplay, infoBirth, infoAge, infoAgeDisplay, infoProvince, infoSchool, avatarUrl, professions, infoShowName, infoShowZodiac, infoShowBirth |
| `links` | 快捷链接 | links |
| `techs` | 技术栈 | techs |
| `todos` | 待办 & 打字机 | todos, typewriterWords |
| `system` | 系统标记 | \_initialized |

### 用户头像

- 上传路径：`POST /api/config/upload/avatar` → 返回 URL
- URL 格式：`/files/uploads/avatar/avatar-{timestamp}-{random}.webp`
- 静态文件前缀：`/files/` → 映射到 `backend/public/`
- 更新头像：`PUT /api/auth/profile` 设置 `avatarUrl`

---

## 七、前端代理配置

开发环境通过 Vite proxy 转发 `/api` 请求到后端：

- 前台 `localhost:3000` → `localhost:8000`（apps/frontend/vite.config.ts）
- 后台 `localhost:3001` → `localhost:8000`（apps/admin/vite.config.ts）

生产环境通过 Caddy 反向代理实现（`Caddyfile` / `Caddyfile.docker`）。

# API 接口文档

> 运行时可通过 Swagger UI 交互查看：http://localhost:8000/api/docs

---

## 一、认证模块

### POST /api/auth/login

管理员登录，获取 JWT Token。

**请求体：**

```json
{
  "username": "admin",
  "password": "admin123"
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

### GET /api/auth/profile

获取当前登录用户信息（需 Bearer Token）。

**请求头：**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**成功响应（200）：**

```json
{
  "id": 1,
  "username": "admin",
  "role": "admin",
  "theme": "light",
  "createdAt": "2026-06-06T...",
  "updatedAt": "2026-06-06T..."
}
```

---

## 二、站点配置模块

### GET /api/config

获取所有配置项（公开接口，无需登录）。

**成功响应（200）：**

```json
{
  "data": [
    {
      "id": 1,
      "configKey": "greeting",
      "configValue": "Hello, World!",
      "createdAt": "2026-06-06T...",
      "updatedAt": "2026-06-06T..."
    }
  ]
}
```

---

### GET /api/config/:key

按 key 获取单条配置（公开接口）。

**成功响应（200）：**

```json
{
  "data": {
    "id": 1,
    "configKey": "greeting",
    "configValue": "Hello, World!",
    "createdAt": "2026-06-06T...",
    "updatedAt": "2026-06-06T..."
  }
}
```

**错误响应（404）：**

```json
{
  "message": "配置项 'xxx' 不存在",
  "error": "Not Found",
  "statusCode": 404
}
```

---

### POST /api/config

新增配置项（需登录）。

**请求体：**

```json
{
  "configKey": "links",
  "configValue": "[{\"title\": \"GitHub\", \"url\": \"https://github.com\"}]"
}
```

**响应（201）：**

```json
{
  "data": {
    "id": 2,
    "configKey": "links",
    "configValue": "[{\"title\": \"GitHub\", \"url\": \"https://github.com\"}]",
    ...
  }
}
```

**错误（409）：** 配置键已存在

---

### PUT /api/config/:key

更新配置项（需登录）。

**请求体：**

```json
{
  "configKey": "greeting",
  "configValue": "你好，世界！"
}
```

**响应（200）：** 返回更新后的配置对象

---

### DELETE /api/config/:key

删除配置项（需登录）。

**响应（200）：**

```json
{
  "message": "配置 'greeting' 已删除"
}
```

---

## 三、错误码汇总

| 状态码 | 含义 | 常见原因 |
|--------|------|---------|
| 200 | 成功 | - |
| 201 | 创建成功 | POST 请求成功 |
| 400 | 请求参数错误 | DTO 校验失败 |
| 401 | 未登录/Token过期 | 缺少或无效的 Bearer Token |
| 404 | 资源不存在 | 配置键不存在 |
| 409 | 资源冲突 | 配置键已存在 |
| 500 | 服务器内部错误 | 请联系开发人员 |

---

## 四、前端代理配置

开发环境通过 Vite proxy 转发 `/api` 请求到后端：

- 前台 `localhost:3000` → `localhost:8000`（apps/frontend/vite.config.ts）
- 后台 `localhost:3001` → `localhost:8000`（apps/admin/vite.config.ts）

生产环境通过 Caddy/Nginx 反向代理实现。

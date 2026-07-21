# API Reference

<p align="right">
  <a href="./api.md">简体中文</a> · <strong>English</strong>
</p>

> An interactive Swagger UI is available at runtime (non-production only): http://localhost:8000/api/docs
>
> Last updated: 2026/06/08 v0.7.0

---

## 1. Auth module

### POST /api/auth/login

Admin login — returns a JWT.

**Request:**

```json
{
  "username": "admin",
  "password": "admin123456"
}
```

**Response 200:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "username": "admin"
}
```

**Response 401:**

```json
{
  "message": "Invalid username or password",
  "error": "Unauthorized",
  "statusCode": 401
}
```

---

### POST /api/auth/forgot-password

Request a password reset. Generates a one-time token; when SMTP is configured an email is sent, otherwise the reset link is written to `docker logs homepage-app`.

**Request:**

```json
{ "username": "admin" }
```

**Response 200:**

```json
{
  "message": "If the user exists, a reset link has been sent (please also check spam).",
  "smtpEnabled": true
}
```

When SMTP is not configured, the response additionally carries a `devHint` telling you to grab the link from logs.

---

### POST /api/auth/reset-password

Set a new password using the one-time reset token.

**Request:**

```json
{
  "token": "the one-time token from the email or docker logs",
  "newPassword": "new password, at least 12 characters"
}
```

**Response 200:** `{ "message": "Password reset. Please log in with the new password." }`

**Response 400:** invalid / expired / already-used token.

---

### GET /api/auth/has-users

Whether any user already exists in the system (public). The frontend uses this to decide whether to show the "create first admin" flow.

**Response 200:** `{ "data": { "hasUsers": false } }`

---

### POST /api/auth/create-first-admin

Create the first admin account. **Only available when the `users` table is empty.**

**Request:**

```json
{
  "username": "admin",
  "password": "your strong password (>= 12 chars)"
}
```

**Response 200:** `{ "message": "Admin account created", "username": "admin" }`

**Response 409:** `{ "message": "An admin account already exists..." }`

---

### GET /api/auth/profile

Get the currently logged-in user (Bearer token required).

**Headers:** `Authorization: Bearer <token>`

**Response 200:**

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

Update your profile (login required).

**Request:**

```json
{
  "avatarUrl": "/files/uploads/avatar/xxx.webp"
}
```

**Response 200:** the updated user (without password).

---

### PUT /api/auth/change-password

Change your password (login required). New password must be at least 12 characters.

**Request:**

```json
{
  "oldPassword": "old-password",
  "newPassword": "new-strong-password-at-least-12-chars"
}
```

**Response 200:**

```json
{
  "message": "Password changed"
}
```

**Response 400:** wrong old password / new equals old / new < 12 chars.

---

## 2. Site config module

### GET /api/config

Fetch all config entries (public).

**Response 200:**

```json
{
  "data": [
    {
      "id": 1,
      "configKey": "name",
      "configValue": "John Doe",
      "category": "info",
      "createdAt": "2026-06-06T...",
      "updatedAt": "2026-06-06T..."
    }
  ]
}
```

---

### GET /api/config/grouped

Fetch all config entries grouped by category (public).

**Response 200:**

```json
{
  "data": {
    "info": [{ "configKey": "name", "configValue": "John Doe", "...": "..." }],
    "links": [],
    "techs": [],
    "todos": []
  }
}
```

---

### GET /api/config/category/:category

Fetch entries by category.

**Example:** `GET /api/config/category/info`

---

### GET /api/config/initialized

Whether the system has been initialized (public).

**Response 200:**

```json
{
  "data": { "initialized": false }
}
```

> Returns `false` when `_initialized = '0'` or the key doesn't exist — the frontend route guard uses this to redirect to `/setup`.

---

### GET /api/config/export/json

Export all config as a downloadable JSON file (login required).

**Response:** file download, `Content-Disposition: attachment; filename="homepage-config.json"`.

---

### GET /api/config/:key

Fetch a single config entry by key (public).

**Response 200:**

```json
{
  "data": {
    "id": 1,
    "configKey": "name",
    "configValue": "John Doe"
  }
}
```

**Response 404:** key not found.

---

### POST /api/config

Create a config entry (login required). Audit log is written automatically.

**Request:**

```json
{
  "configKey": "newKey",
  "configValue": "value",
  "category": "info"
}
```

**Response 201:** the created entry.

**Response 409:** key already exists.

---

### PUT /api/config/:key

Update a config entry (login required). Audit log is written automatically.

**Request:**

```json
{
  "configKey": "name",
  "configValue": "new value",
  "category": "info"
}
```

**Response 200:** the updated entry.

---

### DELETE /api/config/:key

Delete a config entry (login required). Audit log is written automatically.

**Response 200:**

```json
{
  "message": "Config 'xxx' deleted"
}
```

---

### POST /api/config/upload/avatar

Upload an avatar image (login required, `multipart/form-data`).

**Field:** `file` — the image (jpg / png / gif / webp, ≤ 5 MB).

**Pipeline:** multer accepts → sharp compresses to 200×200 WebP → saved under `public/uploads/avatar/`.

**Response 200:**

```json
{
  "data": { "url": "/files/uploads/avatar/avatar-1234567890-123456789.webp" }
}
```

---

## 3. System

### GET /health

Health endpoint (always available, no auth).

**Response 200:**

```json
{
  "status": "ok",
  "timestamp": "2026-06-08T..."
}
```

---

## 4. Audit log module

### GET /api/audit

Paginated audit log (login required).

**Query parameters:**

| Param | Type | Notes |
|------|------|------|
| `page` | number | page, default 1 |
| `limit` | number | page size, default 20 |
| `action` | string | filter by action (CREATE / UPDATE / DELETE) |
| `operator` | string | filter by operator |
| `startDate` | string | start date |
| `endDate` | string | end date |

**Response 200:**

```json
{
  "items": [
    {
      "id": 1,
      "action": "UPDATE",
      "entity": "site_config",
      "entityKey": "name",
      "detail": "{ \"before\": \"old\", \"after\": \"new\" }",
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

## 5. Status code cheatsheet

| Code | Meaning | Typical cause |
|--------|------|---------|
| 200 | OK | GET / PUT succeeded |
| 201 | Created | POST succeeded |
| 400 | Bad request | DTO validation failed (password too short, malformed input, …) |
| 401 | Unauthorized | missing / invalid Bearer token |
| 404 | Not found | key does not exist / Swagger disabled in production |
| 409 | Conflict | config key already exists |
| 429 | Too many requests | rate-limited (120/min globally, 5/min login) |
| 500 | Internal server error | check backend logs |

---

## 6. Data models

### Config categories

| Category | Meaning | Keys |
|------|------|-----------|
| `info` | Personal info | name, infoSex, infoSexDisplay, infoBirth, infoAge, infoAgeDisplay, infoProvince, infoSchool, avatarUrl, professions, infoShowName, infoShowZodiac, infoShowBirth |
| `links` | Quick links | links |
| `techs` | Tech stack | techs |
| `todos` | Todos & typewriter | todos, typewriterWords |
| `system` | System marker | \_initialized |

### Avatar

- Upload path: `POST /api/config/upload/avatar` → returns a URL.
- URL format: `/files/uploads/avatar/avatar-{timestamp}-{random}.webp`.
- Static prefix: `/files/` maps to `backend/public/`.
- Persist to profile: `PUT /api/auth/profile` with `avatarUrl`.

---

## 7. Frontend proxy setup

Development uses Vite's proxy to forward `/api` to the backend:

- Public site `localhost:3000` → `localhost:8000` (`apps/frontend/vite.config.ts`).
- Admin `localhost:3001` → `localhost:8000` (`apps/admin/vite.config.ts`).

Production uses Caddy reverse-proxying (`Caddyfile` / `Caddyfile.docker`).

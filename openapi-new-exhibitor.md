# AiMeet OpenAPI — 出展商管理 API 参考文档

> 版本：2.0
> 最后更新：2026-03-30

## 目录

- [1. 概述](#1-概述)
- [2. 连接信息](#2-连接信息)
- [3. 认证](#3-认证)
- [4. 通用响应格式](#4-通用响应格式)
- [5. API 列表](#5-api-列表)
  - [5.1 获取访问令牌](#51-获取访问令牌)
  - [5.2 获取展会列表](#52-获取展会列表)
  - [5.3 获取子角色组列表](#53-获取子角色组列表)
  - [5.4 创建出展商账号](#54-创建出展商账号)
- [6. 使用流程](#6-使用流程)
- [7. 注意事项](#7-注意事项)
- [8. 错误处理](#8-错误处理)

---

## 1. 概述

本 API 用于第三方系统通过 OpenAPI 创建 AiMeet 出展商账号。

主要功能：
- 创建出展商账号
- 创建账号的同时注册发票/报价单相关信息（exhibitorInfo）
- 自动发送登录通知邮件（可选）

## 2. 连接信息

### 服务器环境

| 环境 | 基础 URL |
|------|----------|
| 生产 | `https://aibox.aimeet.jp/openapi` |
| 测试 | `https://aibox-test.aimeet.jp/openapi` |

### 通信要求

- 通信协议：**TLS 1.2 以上的 HTTPS**
- POST 请求时设置 Content-Type: `application/json`

## 3. 认证

### 认证流程

```
1. 使用 apiKey / secretKey 获取 accessToken
2. 后续请求通过 Authorization header 携带 accessToken（✅ 推荐）
3. accessToken 有效期为 365 天 → 过期后重新获取
```

### 账号信息

API 访问凭证（apiKey / secretKey）由 AiMeet 管理员预先发放。

> **重要**：建议每个账号仅由单一系统使用。有效期内重复调用 `getAccessToken` 会返回同一个 token。服务端已对 token 刷新做了并发安全处理，但仍建议避免多个系统共享同一账号。

### ✅ accessToken 推荐传递方式

| 方式 | 说明 | 推荐 |
|------|------|------|
| **`Authorization: Bearer <token>`** | **HTTP header 传递（不会被服务端日志记录）** | **✅ 推荐** |
| GET `?accessToken=xxx` | URL 参数传递（向后兼容） | 兜底 |
| POST body `accessToken` | 请求体传递（向后兼容） | 兜底 |

## 4. 通用响应格式

所有 API 均返回以下格式的响应：

```json
{
  "status": 0,
  "errmsg": "success",
  "data": {},
  "timeStamp": 1740577332
}
```

### 状态码

| status | 含义 | 处理方式 |
|--------|------|----------|
| 0 | 成功 | — |
| 1001 | 参数错误 | 检查请求参数 |
| 1002 | 认证失败（token 无效） | 重新获取 accessToken |
| 1003 | accessToken 已过期 | 重新获取 accessToken |
| 1004 | HTTP 方法错误 | 确认 GET/POST 是否正确 |
| 1005 | 权限不足 | 确认 group_id 是否在权限范围内 |

## 5. API 列表

---

### 5.1 获取访问令牌

获取认证用的访问令牌。支持 GET 和 POST 两种方式。

| 项目 | 值 |
|------|-----|
| 方法 | GET / POST |
| 路径 | `/auth/getAccessToken` |
| 认证 | 不需要 |

#### 请求参数

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| `apiKey` | 是 | string | API 密钥 |
| `secretKey` | 是 | string | API 秘密密钥 |

#### 请求示例

**GET（向后兼容）**：

```
GET /openapi/auth/getAccessToken?apiKey=your_api_key&secretKey=your_secret_key
```

**✅ POST（推荐，凭证不会出现在 URL 中）**：

```
POST /openapi/auth/getAccessToken
Content-Type: application/json

{
  "apiKey": "your_api_key",
  "secretKey": "your_secret_key"
}
```

> ✅ **推荐使用 POST** 方式调用此接口，避免 `apiKey`/`secretKey` 出现在 URL 中被服务端日志记录。

#### 响应示例

```json
{
  "status": 0,
  "errmsg": "success",
  "data": [
    { "accessToken": "550e8400-e29b-41d4-a716-446655440000" }
  ],
  "timeStamp": 1740577332
}
```

> **注意**：有效期（365 天）内重复调用会返回同一个 token，不会重新生成。过期后调用才会生成新 token。

---

### 5.2 获取展会列表

获取可用的展会列表。用于创建出展商时选择 `exhibition_id`。

| 项目 | 值 |
|------|-----|
| 方法 | GET |
| 路径 | `/exhibition/getExhibitionInfo` |
| 认证 | 需要 |

#### 请求参数

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| `id` | 否 | int | 按展会 ID 筛选 |

#### 请求示例

```
GET /openapi/exhibition/getExhibitionInfo
Authorization: Bearer 550e8400-e29b-41d4-a716-446655440000
```

#### 响应示例

```json
{
  "status": 0,
  "errmsg": "success",
  "data": [
    {
      "id": 10,
      "exhibitionName": "Tokyo Exhibition 2026",
      "exhibitionAdminID": 1,
      "startTime": "2026-04-01",
      "endTime": "2026-04-03",
      "loginStartTime": "2026-03-25",
      "loginEndTime": "2026-04-10",
      "exhibitorNumber": 50,
      "isExternalAPI": 0
    }
  ],
  "timeStamp": 1740577332
}
```

---

### 5.3 获取子角色组列表

获取当前账号下属的子角色组列表，用于创建出展商时选择 `group_id`。

| 项目 | 值 |
|------|-----|
| 方法 | GET |
| 路径 | `/admin/getChildGroupList` |
| 认证 | 需要 |

#### 请求示例

```
GET /openapi/admin/getChildGroupList
Authorization: Bearer 550e8400-e29b-41d4-a716-446655440000
```

#### 响应示例

```json
{
  "status": 0,
  "errmsg": "success",
  "data": [
    { "id": 10, "name": "出展商组A" },
    { "id": 11, "name": "出展商组B" }
  ],
  "timeStamp": 1740577332
}
```

---

### 5.4 创建出展商账号

创建一个新的出展商账号。可选同时注册发票/报价单相关信息（exhibitorInfo）。

| 项目 | 值 |
|------|-----|
| 方法 | POST |
| 路径 | `/admin/newExhibitor` |
| 认证 | 需要 |

#### 请求体

##### 基本字段

| 字段 | 必填 | 类型 | 说明 |
|------|------|------|------|
| `sendLoginInfo` | 否 | int | `1`：发送登录通知邮件 / `0`：不发送（默认 `0`） |
| `username` | 是 | string | 用户名（8~32 位，系统内唯一） |
| `nickname` | 是 | string | 显示名称 |
| `email` | 是 | string | 邮箱（登录通知的收件地址） |
| `password` | 否 | string | 密码（6~16 位）。未指定时自动生成 8 位随机密码 |
| `exhibition_id` | 是 | int | 展会 ID（通过 [5.2 获取展会列表](#52-获取展会列表) 获取） |
| `group_id` | 是 | int | 角色组 ID（通过 [5.3 获取子角色组列表](#53-获取子角色组列表) 获取） |

##### exhibitorInfo 字段（可选）

指定 `exhibitorInfo` 对象时，发票/报价单相关信息会同时注册。不指定则跳过。

| 字段 | 必填 | 类型 | 说明 |
|------|------|------|------|
| `company_name` | 是 | string | 公司名称 |
| `affiliation` | 是 | string | 所属部门 |
| `incharge_name` | 是 | string | 负责人姓名 |
| `address` | 否 | string | 地址 |
| `tel` | 否 | string | 电话号码 |
| `email` | 否 | string | 发票联系邮箱（与账号邮箱不同） |
| `remark` | 否 | string | 备注 |
| `lang` | 否 | int | 语言：`0`=日语（默认），`1`=英语 |
| `payment_status` | 否 | int | 支付状态：`0`=未支付（默认），`1`=已支付 |
| `booth_no` | 否 | string | 展位号 |

> **注意**：指定了 `exhibitorInfo` 时，`company_name`、`affiliation`、`incharge_name` 为必填。

#### 请求示例

**最简配置（不含 exhibitorInfo，密码自动生成，不发邮件）**：

```bash
curl -X POST https://aibox.aimeet.jp/openapi/admin/newExhibitor \
  -H "Authorization: Bearer 550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "exhibitor001",
    "nickname": "株式会社テスト",
    "email": "test@example.com",
    "exhibition_id": 10,
    "group_id": 5
  }'
```

**完整配置（含 exhibitorInfo，指定密码，发送邮件）**：

```bash
curl -X POST https://aibox.aimeet.jp/openapi/admin/newExhibitor \
  -H "Authorization: Bearer 550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '{
    "sendLoginInfo": 1,
    "username": "exhibitor002",
    "nickname": "株式会社サンプル",
    "email": "sample@example.com",
    "password": "Initial123",
    "exhibition_id": 10,
    "group_id": 5,
    "exhibitorInfo": {
      "company_name": "株式会社サンプル",
      "affiliation": "営業部",
      "incharge_name": "田中太郎",
      "address": "東京都渋谷区...",
      "tel": "03-1234-5678",
      "email": "billing@example.com",
      "booth_no": "A-01"
    }
  }'
```

#### 响应示例

**成功**：

```json
{
  "status": 0,
  "errmsg": "success",
  "data": {
    "admin_id": 123,
    "username": "exhibitor001"
  },
  "timeStamp": 1740577332
}
```

**失败（用户名重复）**：

```json
{
  "status": 1001,
  "errmsg": "username already exists",
  "data": [],
  "timeStamp": 1740577332
}
```

**失败（权限不足）**：

```json
{
  "status": 1005,
  "errmsg": "group_id is not in your permission scope",
  "data": [],
  "timeStamp": 1740577332
}
```

---

## 6. 使用流程

创建出展商的推荐流程如下：

```
Step 1: 获取访问令牌
  POST /auth/getAccessToken  （✅ 推荐 POST，凭证不暴露在 URL 中）
  Body: { "apiKey": "xxx", "secretKey": "yyy" }
  → 获取 accessToken（有效期 365 天，有效期内可复用）
        │
        ▼
Step 2: 获取展会列表（首次调用或缓存过期时）
  GET /exhibition/getExhibitionInfo
  Header: Authorization: Bearer <accessToken>
  → 确认可用的 exhibition_id
        │
        ▼
Step 3: 获取子角色组列表（首次调用或缓存过期时）
  GET /admin/getChildGroupList
  Header: Authorization: Bearer <accessToken>
  → 确认可用的 group_id
        │
        ▼
Step 4: 创建出展商账号
  POST /admin/newExhibitor
  Header: Authorization: Bearer <accessToken>
  → 创建账号（+ 可选注册 exhibitorInfo + 可选发送邮件）
```

### ✅ Token 管理推荐模式

```
应用启动
  → 调用 getAccessToken 获取 token（有效期 365 天）
  → 将 token 保存在内存/缓存中
  → 调用 API 时通过 Authorization header 传递 token
  → 收到 status: 1002 或 1003 → 重新获取 token 并重试
```

## 7. 注意事项

### 认证与令牌

- accessToken 有效期为 **365 天**，过期后请重新获取
- ✅ 推荐通过 **`Authorization: Bearer <token>`** header 传递 token（更安全，不会被服务端日志记录）
- 也支持通过 GET/POST 参数传递 `accessToken`（向后兼容）
- 响应中 `status` 为 `1002` 或 `1003` 时需要重新获取 token
- **1 个账号 = 1 个有效 token**，建议不要多个系统共享同一账号
- 有效期内重复调用 `getAccessToken` 会返回同一个 token（不会重新生成）
- 服务端已对并发 token 刷新做了安全处理

### ⚠️ 凭证安全

> **🔒 安全建议**
>
> - `getAccessToken` ✅ 推荐使用 **POST** 方式，`apiKey`/`secretKey` 放在请求体中（不会被服务端日志记录）
> - GET 方式仍然支持（向后兼容），但 **URL 参数可能出现在服务端访问日志中**
> - 后续 API 调用 ✅ 推荐通过 **`Authorization: Bearer <token>`** header 传递 token

### 账号创建

- `username` 在系统内全局唯一，重复会报错
- `username` 限制为 **8~32 位**
- `password` 如果指定，限制为 **6~16 位**
- `password` 省略时会自动生成 **8 位随机密码**
- `sendLoginInfo=1` 时，会向指定的 `email` 发送包含用户名和密码的通知邮件
- `exhibition_id` 和 `group_id` 请使用通过列表查询 API 获取的有效值
- `group_id` 必须在当前账号的权限范围内，超出范围会返回 `status: 1005` 错误

### exhibitorInfo

- `exhibitorInfo` 整个对象是可选的（不传也能创建账号）
- 传了 `exhibitorInfo` 时，`company_name`、`affiliation`、`incharge_name` 为必填
- `exhibitorInfo.email` 与账号的 `email` 是独立的（用于发票/报价单联系）

## 8. 错误处理

### 常见错误及处理方法

| 错误 | 原因 | 处理方式 |
|------|------|----------|
| `status: 1001` "missing apiKey" | getAccessToken 缺少 apiKey 参数 | 检查请求参数 |
| `status: 1001` "missing secretKey" | getAccessToken 缺少 secretKey 参数 | 检查请求参数 |
| `status: 1002` "Unauthorized" | accessToken 无效 | 重新获取 token |
| `status: 1003` "Access token expired" | accessToken 已过期 | 重新获取 token |
| `status: 1001` "username already exists" | 用户名已存在 | 使用其他 username |
| `status: 1001` "password format error" | 密码不满足 6~16 位要求 | 修正密码格式 |
| `status: 1005` "group_id is not in your permission scope" | group_id 超出权限范围 | 通过 getChildGroupList 确认有效的 group_id |
| `status: 1001` "exhibitorInfo: company_name is required" | 指定了 exhibitorInfo 但缺少必填项 | 补全 company_name、affiliation、incharge_name |
| `status: 1004` "Method Not Allowed" | GET/POST 方法用错 | 确认 HTTP 方法 |

### 重试推荐模式

```
API 调用
  → 成功（status: 0）→ 完成
  → status: 1002 或 1003 → 重新获取 token → 重试（最多 1 次）
  → status: 1001 → 需要修正参数（无需重试）
  → status: 1005 → 需要确认 group_id（无需重试）
  → 网络错误 → 等待一段时间后重试（最多 3 次）
```

## 9. 客户端迁移建议

### 9.1 为什么要迁移

当前所有 OpenAPI 调用均通过 URL 参数传递凭证：

```
GET /openapi/auth/getAccessToken?apiKey=xxx&secretKey=yyy
GET /openapi/admin/getChildGroupList?accessToken=d3992c3b-...&exhibition_id=10
```

HTTPS 保护了传输层，但 URL 会被记录在：

- **Azure ALB 访问日志** — 默认记录完整 URL（含查询参数）
- **nginx access log** — 默认的 `$request_uri` 包含查询参数
- **浏览器历史 / 代理服务器日志** — 如果有中间节点

这意味着 `apiKey`、`secretKey`、`accessToken` 以明文形式存在于多处日志中。一旦日志泄露或被未授权访问，凭证直接暴露。

HTTP 请求体（POST body）和请求头（如 `Authorization`）**不会**被上述日志记录。

### 9.2 迁移方式

#### getAccessToken：GET → POST

**迁移前**：

```
GET /openapi/auth/getAccessToken?apiKey=xxx&secretKey=yyy
```

**迁移后**：

```
POST /openapi/auth/getAccessToken
Content-Type: application/x-www-form-urlencoded

apiKey=xxx&secretKey=yyy
```

或 JSON 格式：

```
POST /openapi/auth/getAccessToken
Content-Type: application/json

{"apiKey": "xxx", "secretKey": "yyy"}
```

#### 业务接口：URL 参数 → Authorization header

**迁移前**：

```
GET /openapi/admin/getChildGroupList?accessToken=xxx&exhibition_id=10
```

**迁移后**：

```
GET /openapi/admin/getChildGroupList?exhibition_id=10
Authorization: Bearer xxx
```

token 从 URL 参数移到 header，业务参数保持不变。

### 9.3 迁移优先级

| 优先级 | 项目 | 原因 |
|---|---|---|
| 高 | `getAccessToken` 改用 POST | `apiKey`/`secretKey` 是永久凭证，泄露后需要重置密钥 |
| 中 | 业务接口改用 Bearer header | `accessToken` 有效期 365 天，泄露影响相对可控但窗口较长 |

### 9.4 兼容性

- **无强制迁移要求** — 现有 GET 方式和 URL 参数方式继续支持，不会下线
- 服务端同时支持新旧两种方式，客户端可按自身节奏逐步切换
- 建议新接入的客户端直接使用推荐方式（POST + Bearer header）

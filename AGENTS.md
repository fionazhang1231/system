# 连心社群管理平台 Demo

## 项目概览

香港/澳门社团管理机构数字化 SaaS 平台后台 Demo，聚焦会员管理 + 活动管理两个核心模块。

## 技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19 + TypeScript 5 (strict)
- **UI 组件**: Arco Design React (@arco-design/web-react)
- **Styling**: Tailwind CSS 4
- **图表**: ECharts (echarts-for-react)
- **数据库**: Prisma 5 + SQLite
- **日期处理**: dayjs
- **包管理**: pnpm

## 目录结构

```
├── prisma/
│   ├── schema.prisma         # 数据库 Schema
│   ├── seed.ts               # 种子数据
│   └── dev.db                # SQLite 数据库文件
├── src/
│   ├── app/
│   │   ├── (dashboard)/      # 带侧边栏的仪表盘布局
│   │   ├── login/            # 登录页
│   │   ├── members/          # 会员管理页面
│   │   │   ├── [id]/         # 会员详情 & 编辑
│   │   │   ├── create/       # 新增会员
│   │   │   ├── types/        # 会员类型管理
│   │   │   └── levels/       # 会员等级管理
│   │   ├── activities/       # 活动管理页面
│   │   │   ├── [id]/         # 活动详情 & 编辑 & 签到
│   │   │   └── create/       # 创建活动
│   │   └── api/              # API 路由
│   │       ├── auth/login/   # 模拟登录
│   │       ├── members/      # 会员 CRUD
│   │       ├── member-types/ # 会员类型 CRUD
│   │       ├── member-levels/# 会员等级 CRUD
│   │       └── activities/   # 活动 CRUD + 报名 + 签到 + 导出
│   ├── components/layout/    # 布局组件 (Sidebar, Header, Breadcrumb)
│   ├── hooks/useAuth.tsx     # 认证 Context & Hook
│   ├── lib/
│   │   ├── prisma.ts         # Prisma 客户端单例
│   │   └── api.ts            # 前端 API 请求封装
│   └── types/index.ts        # TypeScript 类型定义
├── next.config.ts
├── package.json
└── tsconfig.json
```

## 开发命令

```bash
# 安装依赖
pnpm install

# 开发环境
pnpm run dev

# 构建
pnpm run build

# 生产启动
pnpm run start

# 数据库操作
npx prisma generate    # 生成 Prisma Client
npx prisma db push     # 同步 Schema 到数据库
npx tsx prisma/seed.ts # 运行种子数据
```

## 数据库

- 使用 SQLite (prisma/dev.db)
- 多租户设计：所有业务表含 org_id 字段，Demo 固定 org_id=1
- 软删除：业务表含 is_deleted 字段

## 认证

- 模拟登录：任意 11 位手机号 + 任意 6 位验证码
- 认证信息存储在 localStorage

## API 路由清单

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/login | 模拟登录 |
| GET | /api/members | 会员列表（支持分页/搜索/筛选） |
| POST | /api/members | 新增会员 |
| GET | /api/members/[id] | 会员详情 |
| PUT | /api/members/[id] | 编辑会员 |
| DELETE | /api/members/[id] | 删除会员（软删除） |
| GET/POST | /api/member-types | 会员类型 CRUD |
| PUT/DELETE | /api/member-types/[id] | 会员类型编辑/删除 |
| GET/POST | /api/member-levels | 会员等级 CRUD |
| PUT/DELETE | /api/member-levels/[id] | 会员等级编辑/删除 |
| GET | /api/activities | 活动列表 |
| POST | /api/activities | 创建活动 |
| GET | /api/activities/[id] | 活动详情 |
| PUT | /api/activities/[id] | 编辑活动 |
| DELETE | /api/activities/[id] | 删除活动 |
| GET/POST | /api/activities/[id]/registrations | 报名列表/新增报名 |
| PUT | /api/activities/[id]/registrations | 审核报名 |
| POST | /api/activities/[id]/checkin | 签到 |
| GET | /api/activities/[id]/export | 导出报名 CSV |

## 设计规范

- 主色：#0E7C7B（深青绿色）
- 背景：#F7F8FA
- 卡片圆角：8px
- 全中文界面

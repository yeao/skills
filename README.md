# yeao/skills

面向 `@gy` 框架（pnpm monorepo + Vue 3）项目的 Agent Skills 集合，兼容 Claude Code、Codex、Cursor 等支持 [Agent Skills 规范](https://agentskills.io/specification) 的 AI 编码工具。

## 安装

使用 [skills CLI](https://github.com/vercel-labs/skills) 安装：

```bash
# 安装全部 skills
npx skills add yeao/skills

# 只安装指定 skill
npx skills add yeao/skills --skill generating-crud-frontend
npx skills add yeao/skills --skill generating-crud-frontend-uni
npx skills add yeao/skills --skill generating-service-api

# 全局安装（对所有项目生效）
npx skills add -g yeao/skills
```

## Skills 列表

| Skill | 说明 |
| --- | --- |
| [`generating-crud-frontend`](./skills/generating-crud-frontend/SKILL.md) | 根据**已有前端 API 类**，一次性生成与项目风格一致的 CRUD 前端**页面**（列表页 + 表单弹窗 + web 端 API 实例注册），支持普通 CRUD 与工作流审批两类模块；不生成服务层 API 文件（API 生成见 `generating-service-api`） |
| [`generating-crud-frontend-uni`](./skills/generating-crud-frontend-uni/SKILL.md) | 根据**已有前端 API 类**，一次性生成与项目风格一致的 CRUD 移动端**页面**（GyList 列表页 + GyForm 表单页 + use-list 配置 + URL 常量与 `pages.json` 注册），`generating-crud-frontend` 的 uni-app 版；不生成服务层 API 文件（API 生成见 `generating-service-api`） |
| [`generating-service-api`](./skills/generating-service-api/SKILL.md) | 服务层 API 的唯一生成入口：根据 **Java 实体类**或 **Spring Controller** 生成/增量更新 `@gy` 风格的前端 API 类（实体接口 + formatter + Api 类），补缺失、修不一致、删多余（删除前检查调用方），并验证重建 dist |

> 三个 skill 均设计为**手动调用**（不会自动触发），在对话中明确说明要使用即可。
>
> 职责划分：`generating-service-api` 负责 service 包下的 API 文件与 `lib/main.ts` 导出；`generating-crud-frontend` 只消费已导出的 Api 类，生成 web 端页面与实例注册；`generating-crud-frontend-uni` 同样只消费服务层，生成 uni-app 端页面与 `pages.json` 注册。

## 目录结构

```
skills/
├── generating-crud-frontend/
│   ├── SKILL.md              # 技能主文档
│   ├── assets/templates/     # 页面生成模板（table/form/manage/dept，含工作流变体）
│   └── references/           # 页面生成规则详细说明
├── generating-crud-frontend-uni/
│   ├── SKILL.md              # 技能主文档（uni-app 移动端）
│   ├── assets/templates/     # 页面生成模板（list-page/list/use-list/form，含工作流变体）
│   └── references/           # 页面生成规则详细说明
└── generating-service-api/
    ├── SKILL.md              # 技能主文档（实体模式 + Controller 模式）
    ├── assets/templates/     # API 层生成模板（api/api-flow）
    └── references/           # 实体 → API 生成规则详细说明
```

## License

MIT

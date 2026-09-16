# yeao/skills

面向 `@gy` 框架（pnpm monorepo + Vue 3）项目的 Agent Skills 集合，兼容 Claude Code、Codex、Cursor 等支持 [Agent Skills 规范](https://agentskills.io/specification) 的 AI 编码工具。

## 安装

使用 [skills CLI](https://github.com/vercel-labs/skills) 安装：

```bash
# 安装全部 skills
npx skills add yeao/skills

# 只安装指定 skill
npx skills add yeao/skills --skill generating-crud-frontend
npx skills add yeao/skills --skill update-api-from-controller

# 全局安装（对所有项目生效）
npx skills add -g yeao/skills
```

## Skills 列表

| Skill | 说明 |
| --- | --- |
| [`generating-crud-frontend`](./skills/generating-crud-frontend/SKILL.md) | 根据建表 SQL / Java 实体类 / 已有前端 API 类，一次性生成与项目风格一致的 CRUD 前端模块（API 类 + 列表页 + 表单弹窗），支持普通 CRUD 与工作流审批两类模块 |
| [`update-api-from-controller`](./skills/update-api-from-controller/SKILL.md) | 将后端 Spring Controller 端点完全同步到前端 `@gy` 风格的 API 类：补缺失、修不一致、删多余（删除前检查调用方） |

> 两个 skill 均设计为**手动调用**（不会自动触发），在对话中明确说明要使用即可。

## 目录结构

```
skills/
├── generating-crud-frontend/
│   ├── SKILL.md              # 技能主文档
│   ├── assets/templates/     # 代码生成模板（api/table/form，含工作流变体）
│   └── references/           # 生成规则详细说明
└── update-api-from-controller/
    └── SKILL.md
```

## License

MIT

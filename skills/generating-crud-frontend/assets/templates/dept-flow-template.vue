<!-- ============================================================
部门入口包装页模板（工作流审批模块）—— 放置于 <app>-web/src/views/<group>/<module>/<file>-dept.vue
用于"按部门查看全部"的菜单页：给 manage 页注入当前用户的主部门与 flowQueryType="all"
占位符：{{EntityName}} / {{file}}
说明：主部门 id 的取法按项目而定——可用 useUserStore().userInfo.deptIds[0]，
     或项目自有的权限工具（如按业务条线取对应主部门）；不需要部门过滤时可删除 byDeptId
============================================================ -->
<template>
  <{{EntityName}}Manage :byDeptId="mainDeptId" flowQueryType="all" />
</template>

<script setup lang="ts">
import { useUserStore } from '@gy/sys-web'
import { computed } from 'vue'

import {{EntityName}}Manage from './{{file}}-manage.vue'

const userStore = useUserStore()
const mainDeptId = computed(() => userStore.userInfo.deptIds[0])
</script>

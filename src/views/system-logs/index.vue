<template>
  <div class="system-logs-page" :class="{ 'theme-dark': navTheme === 'dark' }">
    <div class="page-header">
      <h2><a-icon type="file-text" /> {{ title }}</h2>
      <p>{{ desc }}</p>
    </div>

    <div class="filter-bar">
      <a-select v-model="filterSource" style="width: 130px" allow-clear placeholder="来源">
        <a-select-option value="backend">后端</a-select-option>
        <a-select-option value="frontend">前端</a-select-option>
      </a-select>
      <a-select v-model="filterLevel" style="width: 120px" allow-clear placeholder="级别">
        <a-select-option value="INFO">INFO</a-select-option>
        <a-select-option value="WARN">WARN</a-select-option>
        <a-select-option value="ERROR">ERROR</a-select-option>
      </a-select>
      <a-input v-model="filterModule" placeholder="模块（如 http）" style="width: 170px" allow-clear />
      <a-button type="primary" icon="search" :loading="loading" @click="loadLogs">查询</a-button>
      <a-button icon="reload" @click="loadLogs">刷新</a-button>
    </div>

    <a-table
      :columns="columns"
      :data-source="logs"
      :loading="loading"
      :pagination="pagination"
      row-key="id"
      size="small"
      :scroll="{ x: 900 }"
      @change="handleTableChange"
    >
      <template slot="time" slot-scope="t">
        {{ formatTime(t) }}
      </template>
      <template slot="level" slot-scope="l">
        <a-tag :color="levelColor(l)">{{ l }}</a-tag>
      </template>
      <template slot="source" slot-scope="s">
        <a-tag :color="s === 'frontend' ? 'blue' : 'geekblue'">{{ s === 'frontend' ? '前端' : '后端' }}</a-tag>
      </template>
    </a-table>
  </div>
</template>

<script>
import { getSystemLogs } from '@/api/settings'
import { baseMixin } from '@/store/app-mixin'

export default {
  name: 'SystemLogs',
  mixins: [baseMixin],
  data () {
    return {
      loading: false,
      logs: [],
      filterSource: '',
      filterLevel: '',
      filterModule: '',
      pagination: { current: 1, pageSize: 20, total: 0, showSizeChanger: true, pageSizeOptions: ['20', '50', '100'] },
      columns: [
        { title: 'ID', dataIndex: 'id', width: 70 },
        { title: '来源', dataIndex: 'source', width: 80, scopedSlots: { customRender: 'source' } },
        { title: '时间', dataIndex: 'time', width: 160, scopedSlots: { customRender: 'time' } },
        { title: '级别', dataIndex: 'level', width: 70, scopedSlots: { customRender: 'level' } },
        { title: '模块', dataIndex: 'module', width: 100 },
        { title: '方法', dataIndex: 'method', width: 60 },
        { title: '路由', dataIndex: 'route', width: 210 },
        { title: '状态', dataIndex: 'status', width: 60 },
        { title: '耗时(ms)', dataIndex: 'duration_ms', width: 85 },
        { title: '用户', dataIndex: 'user_id', width: 60 },
        { title: '消息', dataIndex: 'message', ellipsis: true }
      ]
    }
  },
  computed: {
    title () { return this.$t('menu.systemLogs') || '系统日志' },
    desc () { return this.$t('systemLogs.desc') || '查看后端持久化的请求与系统日志' }
  },
  created () {
    this.loadLogs()
  },
  methods: {
    async loadLogs () {
      this.loading = true
      try {
        const res = await getSystemLogs({
          limit: this.pagination.pageSize,
          offset: (this.pagination.current - 1) * this.pagination.pageSize,
          level: this.filterLevel,
          module: this.filterModule,
          source: this.filterSource
        })
        const data = res.data || {}
        this.logs = Array.isArray(data.logs) ? data.logs : []
        this.pagination.total = this.logs.length ? (this.pagination.current - 1) * this.pagination.pageSize + this.logs.length : 0
      } catch (e) {
        this.$message.error(e.backendMessage || e.message || '查询日志失败')
      } finally {
        this.loading = false
      }
    },
    handleTableChange (pagination) {
      this.pagination.current = pagination.current
      this.pagination.pageSize = pagination.pageSize
      this.loadLogs()
    },
    formatTime (t) {
      if (!t) return ''
      const s = String(t)
      return s.replace('T', ' ').slice(0, 19)
    },
    levelColor (l) {
      if (l === 'ERROR') return 'red'
      if (l === 'WARN') return 'orange'
      return 'green'
    }
  }
}
</script>

<style scoped>
.system-logs-page {
  padding: 20px;
  background: #fff;
  min-height: 100vh;
}
.page-header h2 {
  margin: 0 0 4px;
}
.page-header p {
  color: #8c8c8c;
  margin: 0 0 16px;
}
.filter-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  align-items: center;
}
.theme-dark {
  background: #141414;
  color: #e8e8e8;
}
</style>

<template>
  <div class="system-config-page" :class="{ 'theme-dark': navTheme === 'dark' }">
    <div class="page-header">
      <h2><a-icon type="setting" /> {{ title }}</h2>
      <p>{{ desc }}</p>
    </div>

    <a-alert type="info" show-icon message="配置存储于远程数据库 qd_app_config 表，后端从数据库读取，不依赖 .env 文件。" style="margin-bottom: 16px" />

    <a-button type="primary" icon="reload" :loading="loading" @click="loadConfig" style="margin-bottom: 12px">刷新配置</a-button>

    <a-table
      :columns="columns"
      :data-source="configRows"
      :loading="loading"
      :pagination="{ pageSize: 20 }"
      row-key="key"
      size="small"
      :scroll="{ x: 700 }"
    >
      <template slot="value" slot-scope="v">
        <span>{{ maskValue(v) }}</span>
      </template>
    </a-table>
  </div>
</template>

<script>
import { getSystemDbConfig } from '@/api/settings'
import { baseMixin } from '@/store/app-mixin'

export default {
  name: 'SystemConfig',
  mixins: [baseMixin],
  data () {
    return {
      loading: false,
      config: {},
      columns: [
        { title: '配置键', dataIndex: 'key', width: 260 },
        { title: '配置值', dataIndex: 'value', scopedSlots: { customRender: 'value' } }
      ]
    }
  },
  computed: {
    title () { return this.$t('menu.systemConfig') || '系统配置' },
    desc () { return this.$t('systemConfig.desc') || '查看数据库中的系统配置（密钥已脱敏）' },
    configRows () {
      return Object.entries(this.config || {}).map(([key, value]) => ({ key, value }))
    }
  },
  created () {
    this.loadConfig()
  },
  methods: {
    async loadConfig () {
      this.loading = true
      try {
        const res = await getSystemDbConfig()
        this.config = (res.data && typeof res.data === 'object') ? res.data : {}
      } catch (e) {
        this.$message.error(e.backendMessage || e.message || '查询配置失败')
      } finally {
        this.loading = false
      }
    },
    maskValue (v) {
      const s = String(v || '')
      if (!s) return ''
      if (/key|secret|token|password|api_key/i.test(this.keyName || '') && s.length > 8) {
        return s.slice(0, 8) + '***'
      }
      if (s.length > 40) return s.slice(0, 40) + '...'
      return s
    }
  }
}
</script>

<style scoped>
.system-config-page {
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
.theme-dark {
  background: #141414;
  color: #e8e8e8;
}
</style>

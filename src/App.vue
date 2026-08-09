<template>
  <a-config-provider :locale="locale" :direction="direction">
    <div id="app">
      <router-view/>
    </div>
  </a-config-provider>
</template>

<script>
import { domTitle, setDocumentTitle } from '@/utils/domUtil'
import { i18nRender } from '@/locales'

export default {
  data () {
    return {
    }
  },
  computed: {
    locale () {
      const { title } = this.$route.meta
      title && (setDocumentTitle(`${i18nRender(title)} - ${domTitle}`))

      return this.$i18n.getLocaleMessage(this.$store.getters.lang).antLocale
    },
    direction () {
      const lang = this.$store.getters.lang
      return lang && /^ar/i.test(lang) ? 'rtl' : 'ltr'
    },
    theme () {
      return this.$store.state.app.theme
    }
  },
  watch: {
    theme: {
      handler (val) {
        this.applyTheme(val)
      },
      immediate: true
    }
  },
  created () {
    // 跟随系统主题：监听系统黑/白变化
    if (window.matchMedia) {
      this._mql = window.matchMedia('(prefers-color-scheme: dark)')
      this._mqlHandler = (e) => {
        if (this.$store.state.app.theme === 'auto') {
          this.applyTheme('auto')
        }
      }
      if (typeof this._mql.addEventListener === 'function') {
        this._mql.addEventListener('change', this._mqlHandler)
      } else if (typeof this._mql.addListener === 'function') {
        this._mql.addListener(this._mqlHandler)
      }
    }
  },
  beforeDestroy () {
    if (this._mql && this._mqlHandler) {
      if (typeof this._mql.removeEventListener === 'function') {
        this._mql.removeEventListener('change', this._mqlHandler)
      } else if (typeof this._mql.removeListener === 'function') {
        this._mql.removeListener(this._mqlHandler)
      }
    }
  },
  methods: {
    applyTheme (val) {
      // auto = 跟随系统黑白
      let resolved = val
      if (val === 'auto') {
        resolved = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light'
      }
      if (resolved === 'dark' || resolved === 'realdark') {
        document.body.classList.add('dark')
        document.body.classList.toggle('realdark', resolved === 'realdark')
        document.body.classList.remove('light')
      } else {
        document.body.classList.remove('dark')
        document.body.classList.remove('realdark')
        document.body.classList.add('light')
      }
    }
  }
}
</script>

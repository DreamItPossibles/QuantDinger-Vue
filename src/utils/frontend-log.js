// 前端日志上报：把浏览器侧的 error / warn 批量写入后端 qd_system_logs
// （source='frontend'），在系统日志页可与后端日志一起查看。
// 尽力而为：不上报不影响页面功能；登录后才上报；节流批量提交避免刷屏。
import storage from 'store'
import { ACCESS_TOKEN } from '@/store/mutation-types'

const BATCH_SIZE = 20
const FLUSH_INTERVAL = 8000 // 8s 合并一次
const QUEUE_LIMIT = 100

let queue = []
let flushTimer = null
let installed = false

function formatArg (arg) {
  if (arg instanceof Error) return arg.stack || arg.message || String(arg)
  if (typeof arg === 'object') {
    try { return JSON.stringify(arg) } catch (e) { return String(arg) }
  }
  return String(arg)
}

function hasToken () {
  const token = storage.get(ACCESS_TOKEN)
  return Boolean(token && (typeof token === 'string' ? token : (token.token || token.value)))
}

function flush () {
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null }
  if (!queue.length) return
  const batch = queue.splice(0, BATCH_SIZE)
  if (!hasToken()) return
  // 用原生 fetch 上报，避免走 axios 拦截器造成递归。
  try {
    fetch('/api/settings/system/logs/frontend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ entries: batch })
    }).catch(() => {})
  } catch (e) { /* 忽略 */ }
  if (queue.length) scheduleFlush()
}

function scheduleFlush () {
  if (flushTimer) return
  flushTimer = setTimeout(flush, FLUSH_INTERVAL)
}

function push (entry) {
  queue.push(entry)
  if (queue.length > QUEUE_LIMIT) queue.splice(0, queue.length - QUEUE_LIMIT)
  scheduleFlush()
}

function capture (level, args, context) {
  try {
    const text = (args || []).map(formatArg).join(' ')
    if (!text) return
    push({
      level,
      module: context.module || 'frontend',
      message: text.slice(0, 4000),
      route: typeof window !== 'undefined' ? (window.location.hash || window.location.pathname || '') : '',
      request_id: '',
      user_id: null,
      status: context.status || null,
      method: context.method || '',
      duration_ms: context.duration_ms || null
    })
  } catch (e) { /* 忽略 */ }
}

export function installFrontendLogging () {
  if (installed || typeof window === 'undefined') return
  installed = true

  const origError = console.error
  const origWarn = console.warn
  const origInfo = console.info

  console.error = function (...args) {
    try { capture('ERROR', args) } catch (e) { /* 忽略 */ }
    return origError.apply(console, args)
  }
  console.warn = function (...args) {
    try { capture('WARN', args) } catch (e) { /* 忽略 */ }
    return origWarn.apply(console, args)
  }
  console.info = function (...args) {
    try { capture('INFO', args) } catch (e) { /* 忽略 */ }
    return origInfo.apply(console, args)
  }

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event && event.reason
    const err = reason instanceof Error ? reason : new Error(formatArg(reason))
    try { capture('ERROR', [err]) } catch (e) { /* 忽略 */ }
  })

  window.addEventListener('error', (event) => {
    try { capture('ERROR', [event && event.message]) } catch (e) { /* 忽略 */ }
  })

  // 页面关闭前尽力把剩余日志发出去
  window.addEventListener('pagehide', () => { flush() })
}

// 供 request.js 的响应错误拦截调用，携带 HTTP 状态与耗时信息
export function reportRequestError (config, error, durationMs) {
  if (!config || !config.url) return
  const url = String(config.url || '').split('?')[0]
  const status = error && error.response && error.response.status
  const message = (error && (error.backendMessage || error.message)) || `请求失败: ${url}`
  capture(status >= 500 ? 'ERROR' : 'WARN', [message], {
    module: 'http',
    route: url,
    status: status || null,
    method: String((config.method || 'get').toUpperCase()),
    duration_ms: durationMs || null
  })
}

export default { installFrontendLogging, reportRequestError }

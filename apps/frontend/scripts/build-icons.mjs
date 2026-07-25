#!/usr/bin/env node
/**
 * 构建时把 HomeView.vue 里 TECH_ICONS 用到的 `logos:*` 图标从
 * @iconify-json/logos (7 MB) 里抽出来，生成 src/icons/tech-icons.json（几十 KB）。
 *
 * 目的：不依赖 https://api.iconify.design CDN，也不把整个 7 MB icons.json 打进 bundle。
 *
 * 上下游约定：
 *   - 图标名单从 HomeView.vue 的 TECH_ICONS 映射自动解析（正则匹配 'logos:xxx'）
 *   - 若 HomeView 引入新的 `logos:xxx` 图标，重跑 `pnpm build:icons` 即可
 *   - 生成的 JSON 是 IconifyJSON 格式，运行时 addCollection() 后 <Icon /> 会本地渲染
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const frontendRoot = resolve(__dirname, '..')

const HOMEVIEW = resolve(frontendRoot, 'src/views/HomeView.vue')
const SRC_LOGOS = resolve(frontendRoot, 'node_modules/@iconify-json/logos/icons.json')
const OUT_FILE = resolve(frontendRoot, 'src/icons/tech-icons.json')

async function main() {
  const [homeSrc, logos] = await Promise.all([
    readFile(HOMEVIEW, 'utf8'),
    readFile(SRC_LOGOS, 'utf8').then((s) => JSON.parse(s)),
  ])

  // 抓出所有 'logos:xxx' 字面量
  const re = /['"`]logos:([a-z0-9-]+)['"`]/gi
  const names = new Set()
  for (const m of homeSrc.matchAll(re)) names.add(m[1])

  if (!names.size) {
    console.error('[build-icons] 没在 HomeView.vue 中匹配到任何 logos:* 图标，abort')
    process.exit(1)
  }

  const missing = []
  const picked = {}
  for (const name of names) {
    if (logos.icons[name]) picked[name] = logos.icons[name]
    else missing.push(name)
  }

  if (missing.length) {
    console.warn('[build-icons] 以下图标在 @iconify-json/logos 中不存在，将被跳过：')
    for (const n of missing) console.warn('  -', n)
  }

  const subset = {
    prefix: logos.prefix,
    width: logos.width,
    height: logos.height,
    icons: picked,
  }

  await mkdir(dirname(OUT_FILE), { recursive: true })
  await writeFile(OUT_FILE, JSON.stringify(subset), 'utf8')

  const size = Buffer.byteLength(JSON.stringify(subset), 'utf8')
  console.log(
    `[build-icons] 生成 ${OUT_FILE.replace(frontendRoot + '/', '')} — ${names.size - missing.length} 个图标，${(size / 1024).toFixed(1)} KB`,
  )
}

main().catch((e) => {
  console.error('[build-icons] failed:', e)
  process.exit(1)
})

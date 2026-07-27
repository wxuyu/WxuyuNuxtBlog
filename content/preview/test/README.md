# Ys Blog MDC Preview 插件

> 让 Obsidian 直接预览 Nuxt Content MDC 全部 36 个组件。

## 📦 已交付内容

```
.obsidian/plugins/ys-blog-mdc/   ← Obsidian 插件
├── manifest.json                # 插件元数据
├── main.js (34KB)               # 编译后入口
├── main.css (12KB)              # 编译后样式
├── main.ts                      # 源码
├── src/
│   ├── MdcRenderer.ts           # MDC 解析器（块/内联/slot）
│   ├── componentRegistry.ts     # 36 个组件的契约注册表
│   └── renderers/               # 18 个渲染器文件（合并 36 个组件）
└── styles/ys-blog-mdc.css       # 样式源

tools/obsidian-sync/             ← 校验脚本
├── preflight.ts                 # 插件完整性检查
├── validate-mdc.ts              # MDC 用法白名单校验
└── README.md
```

## ✅ 覆盖组件（共 36 个）

| 类别 | 组件 |
|------|------|
| **信息提示** | alert, tip, badge, blur |
| **交互** | tab (含 combobox), folding, copy |
| **媒体** | pic, video-embed, music, music-score, emoji-clock |
| **链接** | link-card, link-banner |
| **角色卡片** | hero, hero-reson-mecha, hero-special, hero-story, hero-timeline-easter |
| **列表/分组** | feed-card, feed-group, card-list, project-group, series-group, info-card |
| **排版装饰** | timeline, md-title, poetry, chat, quote |
| **Prose 包装** | prose-a, prose-code, prose-p, prose-pre, prose-table |
| **特殊** | key (快捷键) |

## 🚀 使用方法

1. 打开 Obsidian，vault 自动识别 `D:\sxiaohe\sxiaohe\nuxt_blog\blog`
2. 设置 → 第三方插件 → 已启用插件 → 应看到 **Ys Blog MDC Preview**
3. 打开 `content/preview/test/demo.md` 查看效果
4. 在任意文章中写 `::alert{type=tip}` 或 `:badge[Vue 3]` 即可预览

## 🔧 开发模式

```powershell
# 编辑 src/* 后重新编译
cd D:\sxiaohe\sxiaohe\nuxt_blog\blog\.obsidian\plugins\ys-blog-mdc
& "D:\sxiaohe\sxiaohe\nuxt_blog\blog\node_modules\.bin\esbuild.cmd" main.ts --bundle --format=cjs --target=es2020 --platform=node --external:obsidian --outfile=main.js
```

## 📊 验证

```powershell
node tools/obsidian-sync/preflight.ts     # ✅ 插件完整 (26 个文件)
node tools/obsidian-sync/validate-mdc.ts  # ✅ 49 md 中 16 个组件全在白名单
```
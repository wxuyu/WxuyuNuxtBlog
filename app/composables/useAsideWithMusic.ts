import type { WidgetName } from './useWidgets'

/**
 * useAsideWithMusic — 给指定 widget 列表追加音乐 widget
 *
 * FloatingPlayer 在移动端（< 768px）会被隐藏，由 'music-player' widget
 * 在 BlogAside 中接管。桌面端 widget 内部 v-if 隐藏，不影响外观。
 *
 * 用法：
 *   layoutStore.setAside(useAsideWithMusic(['blog-stats', 'blog-tech']))
 */
export function useAsideWithMusic(widgets: WidgetName[]): WidgetName[] {
  // 去重避免重复添加
  if (widgets.includes('music-player')) return widgets
  return [...widgets, 'music-player']
}
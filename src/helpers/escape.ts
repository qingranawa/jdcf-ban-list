// 文本内容转义
export function escHtml(s: unknown): string {
  const str = s == null ? '' : String(s)
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// 属性值转义
export function escAttr(s: unknown): string {
  const str = s == null ? '' : String(s)
  return str.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// > HTML/attribute escaping utilities — prevents XSS in template output
// ! escHtml 转义 & < > " '（可用于属性上下文，但 escAttr 更轻量）
// ! escAttr 只转义 " < >（属性中 ' 和 & 安全，除非用反引号）

export function escHtml(s: unknown): string {
  // ? null/undefined → 空字符串，避免 "null" 字面量出现在页面
  const str = s == null ? '' : String(s)
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

export function escAttr(s: unknown): string {
  const str = s == null ? '' : String(s)
  return str.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

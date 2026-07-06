type Row = Record<string, unknown>
type SqlValue = string | number | boolean | null

interface D1Result<T> { results: T[]; success: boolean; meta: Record<string, unknown> }

function strip(alias: string): string {
  return alias.replace(/^(\w+)\s.*$/, '$1')
}

function tableFrom(sql: string): string {
  const matches = [...sql.matchAll(/FROM\s+(?:(\w+)\s+\w+|(\w+))/ig)]
  const m = matches[matches.length - 1]
  return strip(m?.[1] || m?.[2] || '')
}

function colRef(ref: string): string {
  return ref.replace(/^\w+\./, '')
}

export class MockD1 {
  private tables: Map<string, Row[]> = new Map()
  private autoInc: Map<string, number> = new Map()

  seed(table: string, rows: Row[]) {
    this.tables.set(table, [...rows])
    this.autoInc.set(table, rows.length + 1)
  }

  batch(statements: MockStatement[]): { success: boolean; meta: Record<string, unknown> }[] {
    return statements.map(s => s.run())
  }

  prepare(sql: string) {
    return new MockStatement(this, sql)
  }

  getAll(table: string): Row[] { return this.tables.get(table) ?? [] }
  insert(table: string, row: Row): number {
    const rows = this.tables.get(table) ?? []
    const id = this.autoInc.get(table) ?? 1
    const inserted = { id, ...row }
    rows.push(inserted)
    this.tables.set(table, rows)
    this.autoInc.set(table, id + 1)
    return inserted.id as number
  }
  update(table: string, id: number, updates: Partial<Row>): boolean {
    const rows = this.tables.get(table)
    if (!rows) return false
    const idx = rows.findIndex(r => r.id === id)
    if (idx === -1) return false
    rows[idx] = { ...rows[idx], ...updates }
    return true
  }
  delete(table: string, id: number): boolean {
    const rows = this.tables.get(table)
    if (!rows) return false
    const idx = rows.findIndex(r => r.id === id)
    if (idx === -1) return false
    rows.splice(idx, 1)
    return true
  }
}

class MockStatement {
  private sql: string
  private params: SqlValue[] = []
  private db: MockD1

  constructor(db: MockD1, sql: string) { this.db = db; this.sql = sql }
  bind(...args: SqlValue[]) { this.params = args; return this }

  all<T = Row>(): D1Result<T> {
    const rows = this.executeSelect() as T[]
    return { results: rows, success: true, meta: {} }
  }

  first<T = Row>(): T | null {
    const rows = this.executeSelect()
    return (rows.length > 0 ? rows[0] : null) as T | null
  }

  run() {
    const lastId = this.executeMutation()
    return { success: true, meta: { changes: 1, duration: 0, last_row_id: lastId ?? undefined } }
  }

  private executeSelect(): Row[] {
    const s = this.sql.trim().toUpperCase()
    if (/^SELECT\s+COUNT|^SELECT\s+TOTAL/i.test(s) || s.startsWith('SELECT COALESCE') || s.startsWith('SELECT SUM')) {
      return [{ total: 1, c: 1, count: 1 }]
    }
    const table = tableFrom(this.sql)
    if (!table) return []
    let rows = [...(this.db.getAll(table) ?? [])]

    if (s.includes('WHERE')) {
      const wherePart = this.sql.split(/WHERE/i)[1]?.trim() ?? ''
      const qmBefore = (this.sql.split('WHERE')[0].match(/\?/g) || []).length

      const col = (ref: string) => ref.replace(/^\w+\./, '')

      const hasId = /(?:\w+\.)?id\s*=\s*\?/.test(wherePart)
      if (hasId) {
        const idx = qmBefore + (wherePart.split(/\b(?:\w+\.)?id\b/)[0].match(/\?/g) || []).length
        const idVal = this.params[idx]
        rows = rows.filter(r => r.id == idVal)
      }
      if (/(?:\w+\.)?steam_id\s*=\s*\?/.test(wherePart)) {
        const idx = qmBefore + (wherePart.split(/\b(?:\w+\.)?steam_id\b/)[0].match(/\?/g) || []).length
        const val = this.params[idx]
        rows = rows.filter(r => r.steam_id == val)
      }
      const typeEq = wherePart.match(/(?:\w+\.)?type\s*=\s*\?/i)
      if (typeEq) {
        const idx = qmBefore + (wherePart.substring(0, typeEq.index).match(/\?/g) || []).length
        const val = this.params[idx]
        rows = rows.filter(r => r.type === val)
      }
      if (/(?:\w+\.)?is_archived\s*=\s*\?/i.test(wherePart)) {
        const idx = qmBefore + (wherePart.split(/\b(?:\w+\.)?is_archived\b/)[0].match(/\?/g) || []).length
        const val = this.params[idx]
        rows = rows.filter(r => (r.is_archived ?? 0) == val)
      } else if (/is_archived\s*=\s*(\d+)/i.test(wherePart)) {
        const val = parseInt(wherePart.match(/is_archived\s*=\s*(\d+)/i)![1])
        rows = rows.filter(r => (r.is_archived ?? 0) == val)
      }
      if (/(?:\w+\.)?is_published\s*=\s*(\d+)/i.test(wherePart)) {
        const m = wherePart.match(/(?:\w+\.)?is_published\s*=\s*(\d+)/i)
        if (m) {
          const val = parseInt(m[1])
          rows = rows.filter(r => (r.is_published ?? 0) == val)
        }
      }
      if (/\((?:\w+\.)?type\s*!=\s*\?\s+OR\s+\?\s+IS\s+NOT\s+NULL\)/i.test(wherePart)) {
        const i1 = wherePart.indexOf('?')
        const idx = qmBefore + (wherePart.substring(0, i1).match(/\?/g) || []).length
        const typeVal = this.params[idx]
        const isAdminVal = this.params[idx + 1]
        if (isAdminVal == null || isAdminVal === false) {
          rows = rows.filter(r => r.type !== typeVal)
        }
      }
      if (s.includes('LIKE')) {
        const idx = qmBefore + (wherePart.split('LIKE')[0].match(/\?/g) || []).length
        const q = this.params[idx] as string
        if (q) {
          const term = String(q).replace(/%/g, '').toLowerCase()
          rows = rows.filter(r =>
            String(r.nickname ?? '').toLowerCase().includes(term) ||
            String(r.steam_id ?? '').toLowerCase().includes(term) ||
            String(r.ip_address ?? '').toLowerCase().includes(term) ||
            String(r.reason ?? '').toLowerCase().includes(term) ||
            String(r.notes ?? '').toLowerCase().includes(term)
          )
        }
      }
    }

    if (s.includes('ORDER BY')) {
      const orderMatch = this.sql.match(/ORDER BY\s+(?:\w+\.)?(\w+)\s*(DESC|ASC)?/i)
      if (orderMatch) {
        const col = orderMatch[1]
        const dir = (orderMatch[2] ?? 'ASC').toUpperCase()
        rows.sort((a, b) => {
          const av = a[col] as number ?? 0
          const bv = b[col] as number ?? 0
          return dir === 'DESC' ? bv - av : av - bv
        })
      }
    }

    if (s.includes('LIMIT')) {
      const limitIdx = s.includes('LIKE') ? this.params.length - 2 : this.params.length - 2
      if (limitIdx >= 0) {
        const limitVal = this.params[limitIdx] as number
        const offsetVal = this.params[limitIdx + 1] as number ?? 0
        if (typeof limitVal === 'number' && limitVal > 0) {
          rows = rows.slice(offsetVal, offsetVal + limitVal)
        }
      }
    }

    return rows
  }

  private executeMutation(): number | null {
    const s = this.sql.trim().toUpperCase()
    if (s.startsWith('INSERT')) {
      const m = this.sql.match(/INTO\s+(\w+)\s*(?:\(([^)]+)\))?/i)
      if (m) {
        const table = m[1]
        const cols = m[2] ? m[2].split(',').map(c => c.trim().replace(/['"`]/g, '')) : []
        const row: Row = {}
        let pi = 0
        const vi = this.sql.toUpperCase().indexOf('VALUES')
        const openParen = this.sql.indexOf('(', vi)
        let depth = 1
        let closeParen = openParen + 1
        while (closeParen < this.sql.length && depth > 0) {
          if (this.sql[closeParen] === '(') depth++
          else if (this.sql[closeParen] === ')') depth--
          closeParen++
        }
        const valuesStr = this.sql.substring(openParen + 1, closeParen - 1)
        const placeholders = valuesStr.split(',').map(p => p.trim())
        cols.forEach((col, i) => {
          if (placeholders[i] === '?') row[col] = this.params[pi++]
          else row[col] = placeholders[i].replace(/['"]/g, '')
        })
        return this.db.insert(table, { ...row, created_at: new Date().toISOString() })
      }
      return null
    } else if (s.startsWith('UPDATE')) {
      const m = this.sql.match(/UPDATE\s+(\w+)(?:\s+\w+)?\s+SET\s+(.+?)(?:WHERE|$)/i)
      if (m) {
        const table = m[1]
        const setClauses = m[2].split(',').map(c => c.trim())
        const updates: Partial<Row> = {}
        let pi = 0
        setClauses.forEach(clause => {
          const [colRaw, ...valParts] = clause.split('=')
          const col = colRef(colRaw.trim())
          const val = valParts.join('=').trim()
          if (val === '?') updates[col] = this.params[pi++]
          else if (val === '1') updates[col] = 1
          else if (val === '0') updates[col] = 0
          else if (/^'(.+)'$/.test(val)) updates[col] = val.replace(/^'(.*)'$/, '$1')
        })
        if (/WHERE\s+(?:\w+\.)?id\s*=\s*\?/i.test(this.sql)) {
          const idIdx = this.params.length - 1
          const idVal = this.params[idIdx]
          const numericId = typeof idVal === 'string' ? parseInt(idVal) : idVal as number
          this.db.update(table, numericId, updates)
        } else {
          const rows = this.db.getAll(table)
          for (let i = 0; i < rows.length; i++) {
            rows[i] = { ...rows[i], ...updates }
          }
        }
      }
      return null
    } else if (s.startsWith('DELETE')) {
      const m = this.sql.match(/FROM\s+(\w+)/i)
      if (m) {
        const table = m[1]
        this.db.delete(table, this.params[0] as number)
      }
      return null
    }
    return null
  }
}

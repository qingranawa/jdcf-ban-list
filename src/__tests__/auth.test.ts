import { describe, it, expect } from 'vitest'
import { GROUP_RANK, checkOwnership } from '../middleware/auth'

describe('GROUP_RANK', () => {
  it('has all required groups with correct ranks', () => {
    expect(GROUP_RANK).toMatchObject({
      OWNER: 0,
      T6: 1,
      T5: 2,
      T4: 3,
      T3: 4,
      T2: 5,
      T1: 6,
    })
  })

  it('has consecutive numeric values without gaps', () => {
    const values = Object.values(GROUP_RANK).sort((a, b) => a - b)
    for (let i = 0; i < values.length; i++) {
      expect(values[i]).toBe(i)
    }
  })
})

describe('checkOwnership', () => {
  it('allows owner to access own record', () => {
    const result = checkOwnership(1, 1, 'T1')
    expect(result.allowed).toBe(true)
  })

  it('allows access when ownerId is null', () => {
    const result = checkOwnership(null, 1, 'T1')
    expect(result.allowed).toBe(true)
  })

  it('rejects T1 user editing T5 owner record', () => {
    const result = checkOwnership(5, 1, 'T1')
    expect(result.allowed).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('allows T5 user editing other record (overrides ownership)', () => {
    const result = checkOwnership(1, 2, 'T5')
    expect(result.allowed).toBe(true)
  })

  it('allows OWNER to edit any record', () => {
    const result = checkOwnership(1, 2, 'OWNER')
    expect(result.allowed).toBe(true)
  })

  it('allows T6 user editing other record (higher than T5)', () => {
    const result = checkOwnership(1, 2, 'T6')
    expect(result.allowed).toBe(true)
  })

  it('rejects T2 user editing T1 owner record', () => {
    const result = checkOwnership(3, 1, 'T2')
    expect(result.allowed).toBe(false)
  })

  it('allows same-rank override with custom minOverrideRank', () => {
    const result = checkOwnership(5, 1, 'T3', 'T3')
    expect(result.allowed).toBe(true)
  })

  it('rejects insufficient rank with custom minOverrideRank', () => {
    const result = checkOwnership(5, 1, 'T1', 'T3')
    expect(result.allowed).toBe(false)
  })
})

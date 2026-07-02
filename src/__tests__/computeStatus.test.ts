import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { computeStatus } from '../routes/public'

const NOW = new Date('2026-07-02T12:00:00Z').getTime()

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('computeStatus', () => {
  it('warning returns warning regardless of time', () => {
    expect(computeStatus({ ban_duration: 'warning', ban_time: '2020-01-01', archive_action: null })).toBe('warning')
  })

  it('permanent returns permanent regardless of time', () => {
    expect(computeStatus({ ban_duration: 'permanent', ban_time: '2020-01-01', archive_action: null })).toBe('permanent')
  })

  it('50Y is treated as banned (permanent equivalent)', () => {
    expect(computeStatus({ ban_duration: '50Y', ban_time: '2020-01-01', archive_action: null })).toBe('banned')
  })

  it('50y is treated as banned (permanent equivalent)', () => {
    expect(computeStatus({ ban_duration: '50y', ban_time: '2020-01-01', archive_action: null })).toBe('banned')
  })

  it('cfba returns cfba regardless of time', () => {
    expect(computeStatus({ ban_duration: 'cfba', ban_time: '2020-01-01', archive_action: null })).toBe('cfba')
  })

  it('mute-7d returns muted when not yet expired (6 days ago)', () => {
    const sixDaysAgo = new Date(NOW - 6 * 86400000).toISOString()
    expect(computeStatus({ ban_duration: 'mute-7d', ban_time: sixDaysAgo, archive_action: null })).toBe('muted')
  })

  it('mute-7d returns unbanned when expired (8 days ago)', () => {
    const eightDaysAgo = new Date(NOW - 8 * 86400000).toISOString()
    expect(computeStatus({ ban_duration: 'mute-7d', ban_time: eightDaysAgo, archive_action: null })).toBe('unbanned')
  })

  it('30d returns banned when not yet expired (1 day ago)', () => {
    const oneDayAgo = new Date(NOW - 1 * 86400000).toISOString()
    expect(computeStatus({ ban_duration: '30d', ban_time: oneDayAgo, archive_action: null })).toBe('banned')
  })

  it('30d returns unbanned when expired (31 days ago)', () => {
    const thirtyOneDaysAgo = new Date(NOW - 31 * 86400000).toISOString()
    expect(computeStatus({ ban_duration: '30d', ban_time: thirtyOneDaysAgo, archive_action: null })).toBe('unbanned')
  })

  it('1h returns banned when not yet expired (30 minutes ago)', () => {
    const thirtyMinAgo = new Date(NOW - 30 * 60000).toISOString()
    expect(computeStatus({ ban_duration: '1h', ban_time: thirtyMinAgo, archive_action: null })).toBe('banned')
  })

  it('1h returns unbanned when expired (90 minutes ago)', () => {
    const ninetyMinAgo = new Date(NOW - 90 * 60000).toISOString()
    expect(computeStatus({ ban_duration: '1h', ban_time: ninetyMinAgo, archive_action: null })).toBe('unbanned')
  })

  it('1y returns banned when not yet expired (11 months ago)', () => {
    const elevenMonthsAgo = new Date(NOW - 330 * 86400000).toISOString()
    expect(computeStatus({ ban_duration: '1y', ban_time: elevenMonthsAgo, archive_action: null })).toBe('banned')
  })

  it('1y returns unbanned when expired (13 months ago)', () => {
    const thirteenMonthsAgo = new Date(NOW - 395 * 86400000).toISOString()
    expect(computeStatus({ ban_duration: '1y', ban_time: thirteenMonthsAgo, archive_action: null })).toBe('unbanned')
  })

  it('unrecognized duration defaults to banned', () => {
    expect(computeStatus({ ban_duration: 'invalid', ban_time: '2020-01-01', archive_action: null })).toBe('banned')
  })
})

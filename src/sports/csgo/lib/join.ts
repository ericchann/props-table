import type { ScheduleGame, TableRow } from '../../../types/models'

function formatGameTime(game?: ScheduleGame): string | null {
  if (!game?.time) return null
  try {
    const dt = new Date(game.time)
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      month: '2-digit',
      day: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
    const parts = fmt.formatToParts(dt)
    const month = parts.find(p => p.type === 'month')?.value ?? ''
    const day = parts.find(p => p.type === 'day')?.value ?? ''
    const hour = parts.find(p => p.type === 'hour')?.value ?? ''
    const minute = parts.find(p => p.type === 'minute')?.value ?? ''
    const dayPeriod = parts.find(p => p.type === 'dayPeriod')?.value ?? ''
    if (!month || !day || !hour || !minute) return null
    return `${month}/${day} ${hour}:${minute} ${dayPeriod}`
  } catch (err) {
    return null
  }
}

export function buildRows(
  lines: any[],
  trends: any[],
  schedule: ScheduleGame[],
  selectedProp?:
    | 'map12Kills' | 'map3Kills' | 'map12Headshots' | 'map3Headshots' | 'map1Kills' | 'map1Headshots'
): TableRow[] {
  const rows: TableRow[] = []
  function getGameTimestamp(l: any, g?: ScheduleGame): number | null {
    try {
      const cand = (g as any)?.time ?? (g as any)?.date ?? (l as any)?.gameStart ?? null
      if (!cand) return null
      const dt = new Date(cand)
      const t = dt.getTime()
      return Number.isFinite(t) ? t : null
    } catch {
      return null
    }
  }
  for (const l of lines) {
    // projection containers may include multiple prop groups; try to read relevant props
    const proj = l.projection ?? {}

    // helper to safely read a manualOU/over/under for a nested path
    const readProp = (path: string) => {
      try {
        const parts = path.split('.')
        let cur: any = proj
        for (const p of parts) {
          if (cur == null) return null
          cur = cur[p]
        }
        return cur?.manualOU ?? null
      } catch (err) {
        return null
      }
    }

    const readOver = (path: string) => {
      try {
        const parts = path.split('.')
        let cur: any = proj
        for (const p of parts) {
          if (cur == null) return null
          cur = cur[p]
        }
        return cur?.overPrice ?? null
      } catch (err) { return null }
    }

    const readUnder = (path: string) => {
      try {
        const parts = path.split('.')
        let cur: any = proj
        for (const p of parts) {
          if (cur == null) return null
          cur = cur[p]
        }
        return cur?.underPrice ?? null
      } catch (err) { return null }
    }

    // define the six props and the projection paths to look up
    // The API uses slightly different field names than our UI StatKey names.
    // Keep `key` as the UI StatKey, and `api` as the field name present in the API JSON.
    const props = [
      { key: 'map12Kills', api: 'twoMapKills', path: 'twoMapKills.summary' },
      { key: 'map3Kills', api: 'mapThreeKills', path: 'mapThreeKills.summary' },
      { key: 'map12Headshots', api: 'twoMapHeadshots', path: 'twoMapHeadshots.summary' },
      { key: 'map3Headshots', api: 'mapThreeHeadshots', path: 'mapThreeHeadshots.summary' },
      { key: 'map1Kills', api: 'mapOneKills', path: 'mapOneKills.summary' },
      { key: 'map1Headshots', api: 'mapOneHeadshots', path: 'mapOneHeadshots.summary' }
    ] as const

    // find schedule
    let g: ScheduleGame | undefined = undefined
    if (l.slug) {
      g = schedule.find(s => s.home === l.home || s.away === l.away) as any
    }

    // trends lookup: try to find by slug or name (case-insensitive), or id
    const lname = (l.slug ?? l.name ?? '').toString().toLowerCase()
    const t = trends.find((tr: any) => {
      if (!tr) return false
      const tsl = (tr.slug ?? '').toString().toLowerCase()
      const tnm = (tr.name ?? '').toString().toLowerCase()
      const tid = (tr.id ?? '').toString().toLowerCase()
      return tsl && tsl === lname || tnm && tnm === lname || tid && tid === lname
    }) as any

  for (const p of props) {
      if (selectedProp && selectedProp !== p.key) continue
      const line = readProp(p.path)
      if (line == null) continue // only emit rows that exist
      const over = readOver(p.path)
      const under = readUnder(p.path)
      // trends may be keyed by either our UI key or the API field name; try both
      const tb = (t?.[p.key] ?? t?.[p.api]) ?? null

      const row: TableRow = {
        id: `${l.slug ?? l.name}-${p.key}`,
        player: l.name,
        team: l.team ?? '',
        position: l.stats?.position ?? '',
        gameId: (l.gameId ?? '') as string,
        opponent: l.away === l.team ? l.home : l.away ?? '',
        stat: p.key as any,

        line: line ?? null,
        over: over ?? null,
        under: under ?? null,
        stk: tb?.streak ?? 0,

        pctSeason: tb?.currentSeason ?? tb?.all ?? null,
        pctH2H: tb?.vsOpp ?? null,
        pctL5: tb?.l5Rate ?? null,
        pctL10: tb?.l10Rate ?? null,
        pctL20: tb?.l20Rate ?? null,
        pctPrev: tb?.lastSeason ?? null,

        proj: null,
        diff: null,
        dvp: null,

        inj: null,
        hasAlt: false,
        gameTime: formatGameTime(g)
      }
  // Skip rows for games already in the past when we can determine the timestamp
  const ts = getGameTimestamp(l, g)
  if (ts != null && ts <= Date.now()) continue

  rows.push(row)
    }
  }
  return rows
}

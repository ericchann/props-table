import type {
  AltLinesRow, InjuryRow, LinesRow, ProjectionsRow, ScheduleGame,
  StatKey, TableRow, TrendsRow, TrendsBucket
} from '../types/models'

type Dict<T> = Record<string, T | undefined>

const byId = <T extends { id: string }>(rows: T[]) =>
  rows.reduce<Dict<T>>((m, r) => (m[r.id] = r, m), {})

// Remove "-points" | "-rebounds" | "-assists" from id
function baseId(id: string): string {
  return id.replace(/-(points|rebounds|assists)$/i, '')
}

// Check if id ends with the given stat suffix
function idHasStat(id: string, stat: StatKey): boolean {
  return new RegExp(`-${stat}$`, 'i').test(id)
}

// Choose the first non-empty string
function pickStr(...vals: Array<unknown>): string | null {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim() !== '') return v
  }
  return null
}

// Helper function to format game time in EST (uses IANA zone to handle DST)
function formatGameTime(game?: ScheduleGame): string | null {
  if (!game?.time) return null
  try {
    const dt = new Date(game.time)
    // Use Intl to convert to America/New_York (handles EST/EDT)
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      month: '2-digit',
      day: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
    // result like "08/17/ 3:00 PM" — strip year if present
    const parts = fmt.formatToParts(dt)
    const month = parts.find(p => p.type === 'month')?.value ?? ''
    const day = parts.find(p => p.type === 'day')?.value ?? ''
    const hour = parts.find(p => p.type === 'hour')?.value ?? ''
    const minute = parts.find(p => p.type === 'minute')?.value ?? ''
    const dayPeriod = parts.find(p => p.type === 'dayPeriod')?.value ?? ''
    if (!month || !day || !hour || !minute) return null
    return `${month}/${day} ${hour}:${minute} ${dayPeriod}`
  } catch (err) {
    console.error('[buildRows] formatGameTime error', err, game)
    return null
  }
}

function findScheduleGame(schedule: ScheduleGame[] | undefined, l: any) {
  if (!schedule?.length) return undefined

  // 1) try explicit gameId
  if (l.gameId) {
    const byId = schedule.find(s => s.id === l.gameId)
    if (byId) return byId
  }

  const norm = (s?: string) => (s || '').toLowerCase().replace(/\s+/g, '')
  const lHome = norm(l.homeTeam)
  const lAway = norm(l.awayTeam)
  const lTeam = norm(l.team)
  const lOpp = norm(l.opponent)

  // 2) try exact home/away pair
  let match = schedule.find(s => {
    const sh = norm((s as any).home)
    const sa = norm((s as any).away)
    if (lHome || lAway) {
      return (sh === lHome && sa === lAway) || (sh === lAway && sa === lHome)
    }
    if (lTeam && lOpp) {
      return (sh === lTeam && sa === lOpp) || (sh === lOpp && sa === lTeam)
    }
    // fallback: either team matches schedule home/away
    return sh === lTeam || sa === lTeam || sh === lOpp || sa === lOpp
  })
  if (match) return match

  // 3) try matching by datetime proximity (use line.gameStart if present)
  if (l.gameStart) {
    const gs = new Date(l.gameStart)
    if (!isNaN(gs.getTime())) {
      const toleranceMs = 1000 * 60 * 60 * 6 // 6 hours
      match = schedule.find(s => {
        const st = new Date((s as any).time || (s as any).date || '')
        if (isNaN(st.getTime())) return false
        const dt = Math.abs(st.getTime() - gs.getTime())
        if (dt > toleranceMs) return false
        const sh = norm((s as any).home)
        const sa = norm((s as any).away)
        return sh === lTeam || sa === lTeam || sh === lOpp || sa === lOpp
      })
      if (match) return match
    }
  }

  return undefined
}

export function buildRows(
  stat: StatKey,
  opts: {
    lines: LinesRow[]
    projections: ProjectionsRow[]
    trends: TrendsRow[]
    injuries: InjuryRow[]
    alt: AltLinesRow[]
    schedule: ScheduleGame[]
  }
): TableRow[] {
  // removed debug logging

  // Index by BASE id for projections and trends
  const projByBase = Object.values(byId(opts.projections)).reduce<Dict<ProjectionsRow>>((m, pr) => {
    if (!pr) return m
    m[baseId(pr.id)] = pr
    return m
  }, {})

  const trendByBase = Object.values(byId(opts.trends)).reduce<Dict<TrendsRow>>((m, tr) => {
    if (!tr) return m
    m[baseId(tr.id)] = tr
    return m
  }, {})

  const gameById = opts.schedule.reduce<Dict<ScheduleGame>>((m, g) => (m[g.id] = g, m), {})
  const injByBase = opts.injuries.reduce<Dict<InjuryRow>>((m, r) => {
    m[baseId(r.id)] = r
    return m
  }, {})

  const rows: TableRow[] = []

  for (const l of opts.lines) {
    // Only keep the selected stat
    if (typeof l.id === 'string' && !idHasStat(l.id, stat)) continue

    const bId = baseId(l.id)
    const p = (l.projection as any)?.[stat]
    if (!p || !p.summary) {
      continue
    }

    const pr = projByBase[bId]
    const t = trendByBase[bId]
    const tb: TrendsBucket | null | undefined = t?.[stat] ?? null

    const projVal = (pr?.projections as any)?.[stat] ?? null

    const g = findScheduleGame(opts.schedule, l)

    // existing opponent computation uses g
    const opponent =
      l.team === g?.home ? g?.away :
      l.team === g?.away ? g?.home :
      (l.team === l.homeTeam ? l.awayTeam : l.homeTeam)

    const line = p.summary.manualOU ?? (pr?.lines as any)?.[stat] ?? null
    const over = p.summary.overPrice ?? null
    const under = p.summary.underPrice ?? null
    const diff = (projVal != null && line != null) ? +(projVal - line).toFixed(1) : null

    // Pull position from wherever it exists
    const position =
      pickStr(
        (l as any).position,
        (pr as any)?.position,
        (pr as any)?.pos,
        (t as any)?.position
      ) ?? '' // empty string if truly unknown

    const hasAlt = false
    const inj = injByBase[bId]?.status ?? null
    // Prefer formatted schedule time; fallback to the line's gameStart if schedule didn't match
    let gameTime = formatGameTime(g) ?? null
    if (!gameTime && (l as any).gameStart) {
      try {
        const gsIso = new Date((l as any).gameStart).toISOString()
        gameTime = formatGameTime({ id: '', time: gsIso, home: l.homeTeam ?? '', away: l.awayTeam ?? '' } as ScheduleGame)
      } catch {
        gameTime = null
      }
    }

    const row = {
      id: `${bId}-${stat}`,
      stat,
      player: l.name,
      name: l.name,
      team: l.team,
      position,           // <-- make sure this is always present if available
      opponent,
      line,
      over,
      under,
      stk: tb?.streak ?? 0,
      pctSeason: tb?.currentSeason ?? tb?.all ?? null,
      pctPrev: tb?.lastSeason ?? null,
      pctH2H: tb?.vsOpp ?? null,
      pctL5: tb?.l5Rate ?? null,
      pctL10: tb?.l10Rate ?? null,
      pctL20: tb?.l20Rate ?? null,
      proj: projVal,
      diff,
      dvp: null,
      inj,
      hasAlt,
      gameTime // Add gameTime to the row
    } as unknown as TableRow

    rows.push(row)
  }

  return rows
}

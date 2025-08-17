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
  console.debug('[buildRows] start', {
    stat,
    lines: opts.lines.length,
    projections: opts.projections.length,
    trends: opts.trends.length,
    injuries: opts.injuries.length,
    alt: opts.alt.length,
    schedule: opts.schedule.length
  })

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
      console.debug('[buildRows] skip: missing projection/summary', { id: l.id, name: l.name })
      continue
    }

    const pr = projByBase[bId]
    const t = trendByBase[bId]
    const tb: TrendsBucket | null | undefined = t?.[stat] ?? null

    const projVal = (pr?.projections as any)?.[stat] ?? null

    const g = gameById[l.gameId]
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
      hasAlt
    } as unknown as TableRow

    rows.push(row)
  }

  console.debug('[buildRows] done', { rowsCount: rows.length, first: rows[0] })
  return rows
}

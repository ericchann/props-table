import type {
  AltLinesRow, InjuryRow, LinesRow, ProjectionsRow, ScheduleGame,
  StatKey, TableRow, TrendsRow, TrendsBucket
} from '../types/models'

type Dict<T> = Record<string, T | undefined>

const byId = <T extends { id: string }>(rows: T[]) =>
  rows.reduce<Dict<T>>((m, r) => (m[r.id] = r, m), {})

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

  const projById = byId(opts.projections)
  const trendById = byId(opts.trends)
  const gameById = opts.schedule.reduce<Dict<ScheduleGame>>((m, g) => (m[g.id] = g, m), {})
  const injById = opts.injuries.reduce<Dict<InjuryRow>>((m, r) => (m[r.id] = r, m), {})

  const rows: TableRow[] = []

  for (const l of opts.lines) {
    const p = (l.projection as any)?.[stat]
    if (!p || !p.summary) {
      console.debug('[buildRows] skip: missing projection/summary', { id: l.id, name: l.name })
      continue
    }

    const pr = projById[l.id]
    const projVal = (pr?.projections as any)?.[stat] ?? null

    const t = trendById[l.id]
    const tb: TrendsBucket | null | undefined = t?.[stat] ?? null

    const g = gameById[l.gameId]
    const opponent =
      l.team === g?.home ? g?.away :
      l.team === g?.away ? g?.home :
      (l.team === l.homeTeam ? l.awayTeam : l.homeTeam)

    const line = p.summary.manualOU ?? (pr?.lines as any)?.[stat] ?? null
    const over = p.summary.overPrice ?? null
    const under = p.summary.underPrice ?? null
    const diff = (projVal != null && line != null) ? +(projVal - line).toFixed(1) : null

    // no alt-lines usage anymore — always false
    const hasAlt = false
    const inj = injById[l.id]?.status ?? null

    const row = {
      id: l.id,
      stat,
      player: l.name,
      name: l.name,
      team: l.team,
      position: l.position,
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

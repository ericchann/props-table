import type {
  AltLinesRow, InjuryRow, LinesRow, ProjectionsRow, ScheduleGame,
  StatKey, TableRow, TrendsRow
} from '../types/models'

type Dict<T> = Record<string, T>

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
  const projById = byId(opts.projections)
  const trendById = byId(opts.trends)

  // for alt-lines quick lookup
  const altKey = (id: string, g: string, prop: string) => `${id}|${g}|${prop}`
  const altSet = new Set(
    opts.alt.map(a => altKey(a.id, a.gameId, a.prop))
  )

  // for opponent lookup
  const gameById = opts.schedule.reduce<Dict<ScheduleGame>>((m, g) => (m[g.id] = g, m), {})

  // injuries by player id (fall back by name/team if API differs)
  const injById = opts.injuries.reduce<Dict<InjuryRow>>((m, r) => (m[r.id] = r, m), {})

  const rows: TableRow[] = []
  for (const l of opts.lines) {
    const p = l.projection[stat] as any
    if (!p || !p.summary) continue

    const t = trendById[l.id]
    const tb = t?.[stat] as any
    const pr = projById[l.id]
    const projVal = (pr?.projections as any)?.[stat] as number | null | undefined

    const g = gameById[l.gameId]
    const opponent =
      l.team === g?.home ? g?.away :
      l.team === g?.away ? g?.home :
      (l.team === l.homeTeam ? l.awayTeam : l.homeTeam)

    const line = p.summary.manualOU ?? (pr?.lines as any)?.[stat] ?? null
    const over = p.summary.overPrice ?? null
    const under = p.summary.underPrice ?? null

    const diff = (projVal != null && line != null) ? +(projVal - line).toFixed(1) : null

    const row: TableRow = {
      id: l.id,
      player: l.name,
      team: l.team,
      position: l.position,
      gameId: l.gameId,
      opponent: opponent as any,
      stat,

      line,
      over,
      under,
      stk: tb?.streak ?? 0,

      pctSeason: tb?.currentSeason ?? null,
      pctH2H: tb?.vsOpp ?? null,
      pctL5: typeof tb?.l5Rate === 'string' ? Number(tb?.l5Rate) : tb?.l5Rate ?? null,
      pctL10: tb?.l10Rate ?? null,
      pctL20: typeof tb?.l20Rate === 'string' ? Number(tb?.l20Rate) : tb?.l20Rate ?? null,
      pctPrev: tb?.lastSeason ?? null,

      proj: projVal ?? null,
      diff,
      dvp: tb?.oppDef ?? null,

      inj: injById[l.id]?.status ?? null,
      hasAlt: altSet.has(altKey(l.id, l.gameId, stat))
    }
    rows.push(row)
  }
  return rows
}

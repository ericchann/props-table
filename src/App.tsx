import React, { useMemo, useState } from 'react'
import { useQuery, useQueries } from '@tanstack/react-query'
import Loading from './components/Loading'
import Table from './components/Table/Table'
import { getLines } from './api/lines'
import { getProjections } from './api/projections'
import { getTrends } from './api/trends'
import { getInjuries } from './api/injuries'
import { getSchedule } from './api/schedule'
import { buildRows } from './lib/join'
import { getDvp, type DvpRankMap, type DvpPos, type ApiStatKey } from './api/dvp'

export default function App() {
  const [stat, setStat] = useState<'points' | 'rebounds' | 'assists'>('points')

  // ---- Queries (always same order) ----
  const qLines = useQuery({ queryKey: ['lines'], queryFn: getLines })
  const qProjections = useQuery({ queryKey: ['projections'], queryFn: getProjections })
  const qTrends = useQuery({ queryKey: ['trends'], queryFn: getTrends })
  const qInjuries = useQuery({ queryKey: ['injuries'], queryFn: getInjuries })
  const qSchedule = useQuery({ queryKey: ['schedule'], queryFn: getSchedule })

  React.useEffect(() => {
    console.debug('[App] qLines:', { status: qLines.status, length: qLines.data?.length ?? 'nil', error: qLines.error })
    console.debug('[App] qProjections:', { status: qProjections.status, length: qProjections.data?.length ?? 'nil', error: qProjections.error })
    console.debug('[App] qTrends:', { status: qTrends.status, length: qTrends.data?.length ?? 'nil', error: qTrends.error })
    console.debug('[App] qInjuries:', { status: qInjuries.status, length: qInjuries.data?.length ?? 'nil', error: qInjuries.error })
    console.debug('[App] qSchedule:', { status: qSchedule.status, length: qSchedule.data?.length ?? 'nil', error: qSchedule.error })
  }, [qLines.status, qProjections.status, qTrends.status, qInjuries.status, qSchedule.status])

  // Build rows even while queries are loading (empty arrays until ready)
  const rows = buildRows(stat, {
    lines: qLines.data ?? [],
    projections: qProjections.data ?? [],
    trends: qTrends.data ?? [],
    injuries: qInjuries.data ?? [],
    alt: [],
    schedule: qSchedule.data ?? []
  })

  // ---------- Derive opponent from schedule when missing ----------
  type SGame = { id: string; home: string; away: string }
  const gameById = useMemo(() => {
    const m = new Map<string, SGame>()
    for (const g of (qSchedule.data ?? []) as any[]) {
      // Allow various shapes {id, home, away} or {id, homeTeam, awayTeam}
      const home = (g as any).home ?? (g as any).homeTeam
      const away = (g as any).away ?? (g as any).awayTeam
      if (g?.id && home && away) m.set(String(g.id), { id: String(g.id), home: String(home), away: String(away) })
    }
    return m
  }, [qSchedule.data])

  function deriveOpponent(row: any): string | null {
    // If already present, use it
    if (row?.opponent) return String(row.opponent)
    const team = row?.team ? String(row.team) : null
    const gid = row?.gameId ? String(row.gameId) : null
    if (team && gid && gameById.has(gid)) {
      const g = gameById.get(gid)!
      if (team === g.home) return g.away
      if (team === g.away) return g.home
    }
    // Fallbacks: some rows might carry homeTeam/awayTeam on themselves
    const homeTeam = row?.homeTeam
    const awayTeam = row?.awayTeam
    if (team && homeTeam && awayTeam) {
      return team === homeTeam ? String(awayTeam) : String(homeTeam)
    }
    return null
  }

  const rowsEnsuredOpp = rows.map(r => {
    const opp = deriveOpponent(r)
    if (!opp) console.debug('[DVP] opponent missing; could not derive from schedule', { id: r.id, team: r.team, gameId: (r as any).gameId })
    return { ...r, opponent: opp ?? r.opponent ?? null }
  })

  // --------- TEAM NORMALIZATION (map to Props.cash codes) ----------
  const TEAM_ALIASES: Record<string, string> = {
    ATL: 'ATL', CHI: 'CHI', CON: 'CON', DAL: 'DAL', IND: 'IND',
    LAS: 'LAS', LVA: 'LVA', MIN: 'MIN', NYL: 'NYL', PHX: 'PHX',
    SEA: 'SEA', WAS: 'WAS',
    // common alternates
    NY: 'NYL', NYC: 'NYL', LIBERTY: 'NYL', 'NEW YORK': 'NYL', 'NEW YORK LIBERTY': 'NYL',
    LV: 'LVA', 'LAS VEGAS': 'LVA', 'LAS VEGAS ACES': 'LVA', ACES: 'LVA',
    LA: 'LAS', 'LOS ANGELES': 'LAS', 'LOS ANGELES SPARKS': 'LAS', SPARKS: 'LAS',
    PHO: 'PHX', PHOENIX: 'PHX', 'PHOENIX MERCURY': 'PHX', MERCURY: 'PHX',
    CONN: 'CON', CONNECTICUT: 'CON', 'CONNECTICUT SUN': 'CON', SUN: 'CON',
    CHICAGO: 'CHI', 'CHICAGO SKY': 'CHI', SKY: 'CHI',
    ATLANTA: 'ATL', 'ATLANTA DREAM': 'ATL', DREAM: 'ATL',
    DALLAS: 'DAL', 'DALLAS WINGS': 'DAL', WINGS: 'DAL',
    INDIANA: 'IND', 'INDIANA FEVER': 'IND', FEVER: 'IND',
    MINNESOTA: 'MIN', 'MINNESOTA LYNX': 'MIN', LYNX: 'MIN',
    SEATTLE: 'SEA', 'SEATTLE STORM': 'SEA', STORM: 'SEA',
    WASHINGTON: 'WAS', 'WASHINGTON MYSTICS': 'WAS', MYSTICS: 'WAS',
  }

  function normalizeTeam(raw?: string | null): string | null {
    if (!raw) return null
    const t = raw.toString().trim().toUpperCase().replace(/\./g, '').replace(/\s+/g, ' ')
    if (TEAM_ALIASES[t]) return TEAM_ALIASES[t]
    const first3 = t.slice(0, 3)
    if (TEAM_ALIASES[first3]) return TEAM_ALIASES[first3]
    if (t === 'NY') return 'NYL'
    if (t === 'LV') return 'LVA'
    if (t === 'LA') return 'LAS'
    return null
  }

  // --------- DVP (fetch per normalized opponent team, cached) ----------
  const teamsNeeded = useMemo(() => {
    const s = new Set<string>()
    for (const r of rowsEnsuredOpp) {
      const norm = normalizeTeam((r as any).opponent)
      if (norm) s.add(norm)
    }
    return Array.from(s).sort()
  }, [rowsEnsuredOpp])

  const dvpQueries = useQueries({
    queries: teamsNeeded.map(team => ({
      queryKey: ['dvp', team],
      queryFn: () => getDvp(team),
      staleTime: 60 * 60 * 1000, // 1 hour cache
    })),
  })

  React.useEffect(() => {
    dvpQueries.forEach(q => {
      if (q.isError) console.warn('[DVP] fetch error', q.queryKey, q.error)
    })
  }, [dvpQueries])

  const dvpByTeam = useMemo(() => {
    const m = new Map<string, DvpRankMap>()
    dvpQueries.forEach(q => {
      const d = q.data as DvpRankMap | undefined
      if (d?.team) m.set(d.team, d)
    })
    return m
  }, [dvpQueries])

  // app stat → API stat key
  const STAT_TO_API: Record<'points' | 'rebounds' | 'assists', ApiStatKey> = {
    points: 'PTS',
    rebounds: 'TRB',
    assists: 'AST',
  }

  function normalizePos(p?: string | null): DvpPos | null {
    if (!p) return null
    const first = p.split(/[-/ ]/)[0]?.toUpperCase() ?? ''
    if (first === 'PG' || first === 'SG' || first === 'SF' || first === 'PF' || first === 'C') return first as DvpPos
    if (first === 'G') return 'PG'
    if (first === 'F') return 'SF'
    if (first === 'C') return 'C'
    return null
  }

  const rowsWithDvp = rowsEnsuredOpp.map(r => {
    const normTeam = normalizeTeam((r as any).opponent)
    const pos = normalizePos((r as any).position)
    const apiStat = STAT_TO_API[stat]
    const dvp = normTeam ? dvpByTeam.get(normTeam) : undefined

    let rank: number | null = null
    if (dvp && pos) {
      const byPos = dvp.ranks[pos]
      const maybe = byPos?.[apiStat]
      rank = typeof maybe === 'number' ? maybe : null
    }

    return { ...r, dvp: rank }
  })

  // ---- N/A filter: drop rows with >= 3 N/As across core fields ----
  function isNA(v: unknown) {
    if (v == null) return true
    const s = String(v).trim()
    return s === '—' || s === '---'
  }
  function countNAs(row: any) {
    const CORE_FIELDS = ['over','under','pctSeason','pctL5','pctL10','pctL20','proj','diff'] as const
    let n = 0
    for (const f of CORE_FIELDS) if (isNA(row[f])) n++
    return n
  }

  const MAX_ALLOWED_NA = 2
  const removedRows = rowsWithDvp.filter(r => countNAs(r) > MAX_ALLOWED_NA)
  let filteredRows = rowsWithDvp.filter(r => countNAs(r) <= MAX_ALLOWED_NA)
  if (filteredRows.length === 0) {
    console.warn('[App] N/A filter removed all rows. Falling back to unfiltered.')
    filteredRows = rowsWithDvp
  }

  // After all hooks: decide what to render
  const isLoading = [qLines, qProjections, qTrends, qInjuries, qSchedule].some(q => q.isLoading)
  const error = [qLines, qProjections, qTrends, qInjuries, qSchedule].find(q => q.isError)?.error

  if (isLoading) return <Loading />
  if (error) {
    return (
      <div style={{ padding: 12 }}>
        <h2>Error</h2>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{String(error)}</pre>
      </div>
    )
  }

  console.debug('[App] DVP teams needed:', teamsNeeded)
  console.debug('[App] built rows', rows.length, 'kept', filteredRows.length, 'removed', removedRows.length)

  return (
    <div style={{ padding: 20, textAlign: 'center' }}>
      <h1 style={{ fontSize: '100px', fontWeight: 700, marginBottom: '80px' }}>
        WNBA Betting Table
      </h1>

      {/* Center this whole form group, but left-align its contents */}
      <div style={{ display: 'inline-block', textAlign: 'left', marginBottom: 20 }}>
        <label htmlFor="stat" style={{ fontWeight: 500, display: 'block', marginBottom: 8 }}>
          Props
        </label>
        <select
          id="stat"
          value={stat}
          onChange={(e) => setStat(e.target.value as 'points' | 'rebounds' | 'assists')}
          style={{
            padding: '10px 14px',
            border: '1px solid #e1e1e1',
            borderRadius: 8,
            background: '#fff',
            fontSize: 16,
            minWidth: 160,
          }}
        >
          <option value="points">Points</option>
          <option value="rebounds">Rebounds</option>
          <option value="assists">Assists</option>
        </select>
      </div>

      <Table rows={filteredRows} />
    </div>
  )
}

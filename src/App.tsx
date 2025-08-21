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

  // ---- Queries ----
  const qLines = useQuery({ queryKey: ['lines'], queryFn: getLines })
  const qProjections = useQuery({ queryKey: ['projections'], queryFn: getProjections })
  const qTrends = useQuery({ queryKey: ['trends'], queryFn: getTrends })
  const qInjuries = useQuery({ queryKey: ['injuries'], queryFn: getInjuries })
  const qSchedule = useQuery({ queryKey: ['schedule'], queryFn: getSchedule })

  React.useEffect(() => {

  }, [qLines.status, qProjections.status, qTrends.status, qInjuries.status, qSchedule.status])

  // Build rows (works even while some queries are still loading)
  const rows = buildRows(stat, {
    lines: qLines.data ?? [],
    projections: qProjections.data ?? [],
    trends: qTrends.data ?? [],
    injuries: qInjuries.data ?? [],
    alt: [],
    schedule: qSchedule.data ?? [],
  })

  // ---------- Team normalization ----------
  const TEAM_ALIASES: Record<string, string> = {
    ATL: 'ATL', CHI: 'CHI', CON: 'CON', DAL: 'DAL', IND: 'IND',
    LAS: 'LAS', LVA: 'LVA', MIN: 'MIN', NYL: 'NYL', PHX: 'PHX',
    SEA: 'SEA', WAS: 'WAS', GSV: 'GSV',
    // common alternates / normalizations
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

  // ---------- Derive opponent from SCHEDULE (home/away) ----------
  type SGame = { id: string; home: string; away: string }

  const opponentByTeam = React.useMemo(() => {
    const m = new Map<string, string>()
    const games = (qSchedule.data ?? []) as SGame[]

    for (const g of games) {
      const home = normalizeTeam(g?.home)
      const away = normalizeTeam(g?.away)
      if (!home || !away) continue
      m.set(home, away)
      m.set(away, home)
    }
    return m
  }, [qSchedule.data])

  const rowsEnsuredOpp = rows.map(r => {
    const team = normalizeTeam((r as any)?.team)
    if (!team) {
      
      return { ...r, opponent: '' } // keep prop shape: string
    }
    const opp = opponentByTeam.get(team) ?? ''
    return { ...r, opponent: opp }
  })

  // --------- DVP lookup ----------
  const teamsNeeded = useMemo(() => {
    const s = new Set<string>()
    for (const r of rowsEnsuredOpp) {
      const norm = normalizeTeam((r as any).opponent)
      if (norm) s.add(norm)
    }
    return Array.from(s).sort()
  }, [rowsEnsuredOpp])

  // When querying DVP, remap 'GSV' → 'LVA'
  const dvpQueries = useQueries({
    queries: teamsNeeded.map(team => {
      const queryTeam = team === 'GSV' ? 'LVA' : team
      return {
        queryKey: ['dvp', queryTeam],
        queryFn: () => getDvp(queryTeam),
        staleTime: 60 * 60 * 1000,
        enabled: teamsNeeded.length > 0, // Add this to ensure queries run
      }
    }),
  })

  const dvpByTeam = useMemo(() => {
    const m = new Map<string, DvpRankMap>()
    dvpQueries.forEach((q) => {
      const d = q.data as DvpRankMap | undefined
      if (d?.team) m.set(d.team, d)
    })
    return m
  }, [dvpQueries])

  // UI stat → API key
  const STAT_TO_API: Record<'points' | 'rebounds' | 'assists', ApiStatKey> = {
    points: 'PTS',
    rebounds: 'TRB', // canonical
    assists: 'AST',
  }

  function normalizePos(p?: string | null): DvpPos | null {
    if (!p) return null
    const first = p.split(/[-/ ]/)[0]?.toUpperCase() ?? ''
    if (first === 'PG' || first === 'SG' || first === 'SF' || first === 'PF' || first === 'C') return first as DvpPos
    if (first === 'G') return 'PG'
    if (first === 'F') return 'SF'
    return null
  }

  const rowsWithDvp = rowsEnsuredOpp.map(r => {
    const rawOpp = (r as any).opponent as string
    const normTeam = normalizeTeam(rawOpp)
    const dvpTeam = normTeam === 'GSV' ? 'LVA' : normTeam
    const pos = normalizePos((r as any).position)
    const apiStat = STAT_TO_API[stat]
    const dvp = dvpTeam ? dvpByTeam.get(dvpTeam) : undefined

    let rank: number | null = null
    if (dvp && pos) {
      const byPos = dvp.ranks[pos] as Record<string, number | null> | undefined
      const keysToTry = apiStat === 'TRB' ? (['TRB', 'REB'] as const) : ([apiStat] as const)
      
      for (const k of keysToTry) {
        const v = byPos?.[k]
        if (typeof v === 'number') { 
          rank = v
          break 
        }
      }
    }

    return { ...r, dvp: rank }
  })


  // ---- N/A filter ----
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

  // Final loading/error gate
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

  console.debug('[App] built rows', rows.length, 'kept', filteredRows.length, 'removed', removedRows.length)

  return (
    <div style={{ padding: 20, textAlign: 'center' }}>
      <h1 style={{ fontSize: '100px', fontWeight: 700, marginBottom: '80px' }}>
        WNBA Betting Table
      </h1>

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

      {/* If your Table component needs a strict type, keep `opponent` as string above.
          Casting to any avoids friction if TableRow's exact type differs. */}
      <Table rows={filteredRows as any} />
    </div>
  )
}

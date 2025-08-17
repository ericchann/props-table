import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Loading from './components/Loading'
import Table from './components/Table/Table'
import { getLines } from './api/lines'
import { getProjections } from './api/projections'
import { getTrends } from './api/trends'
import { getInjuries } from './api/injuries'
import { getSchedule } from './api/schedule'
import { buildRows } from './lib/join'

export default function App() {
  const [stat, setStat] = useState<'points' | 'rebounds' | 'assists'>('points')

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

  const rows = buildRows(stat, {
    lines: qLines.data ?? [],
    projections: qProjections.data ?? [],
    trends: qTrends.data ?? [],
    injuries: qInjuries.data ?? [],
    alt: [],
    schedule: qSchedule.data ?? []
  })

  // N/A filter: drop rows with 3+ N/As across core fields
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
  const removedRows = rows.filter(r => countNAs(r) > MAX_ALLOWED_NA)
  let filteredRows = rows.filter(r => countNAs(r) <= MAX_ALLOWED_NA)
  if (filteredRows.length === 0) {
    console.warn('[App] N/A filter removed all rows. Falling back to unfiltered.')
    filteredRows = rows
  }

  console.debug('[App] built rows', rows.length, 'kept', filteredRows.length, 'removed', removedRows.length)
  if (removedRows.length > 0) {
    console.debug('[App] removed rows:', removedRows.map(r => ({
      player: r.player,
      team: r.team,
      position: r.position,
      stat: r.stat,
      id: r.id
    })))
  }

  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <h2 style={{ margin: 0 }}>Props table</h2>
        <label htmlFor="stat" style={{ fontWeight: 600 }}>Stat</label>
        <select
          id="stat"
          value={stat}
          onChange={(e) => setStat(e.target.value as 'points' | 'rebounds' | 'assists')}
          style={{
            padding: '6px 8px',
            border: '1px solid #e1e1e1',
            borderRadius: 8,
            background: '#fff',
            fontSize: 14
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

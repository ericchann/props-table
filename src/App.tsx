import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getLines } from './api/lines'
import { getProjections } from './api/projections'
import { getTrends } from './api/trends'
import { getInjuries } from './api/injuries'
import { getAltLines } from './api/altLines'
import { getSchedule } from './api/schedule'
import { buildRows } from './lib/join'
import type { StatKey } from './types/models'
import Table from './components/Table/Table'

export default function App() {
  const [stat, setStat] = useState<StatKey>('points')

  const qLines       = useQuery({ queryKey: ['lines'],       queryFn: getLines })
  const qProj        = useQuery({ queryKey: ['projections'], queryFn: getProjections })
  const qTrends      = useQuery({ queryKey: ['trends'],      queryFn: getTrends })
  const qInj         = useQuery({ queryKey: ['injuries'],    queryFn: getInjuries })
  const qAlt         = useQuery({ queryKey: ['alt-lines'],   queryFn: getAltLines })
  const qSchedule    = useQuery({ queryKey: ['schedule'],    queryFn: getSchedule })

  const isLoading = [qLines, qProj, qTrends, qInj, qAlt, qSchedule].some(q => q.isLoading)
  const isError   = [qLines, qProj, qTrends, qInj, qAlt, qSchedule].some(q => q.isError)

  const rows = useMemo(() => {
    if (![qLines.data, qProj.data, qTrends.data, qInj.data, qAlt.data, qSchedule.data].every(Boolean)) return []
    return buildRows(stat, {
      lines: qLines.data!, projections: qProj.data!,
      trends: qTrends.data!, injuries: qInj.data!,
      alt: qAlt.data!, schedule: qSchedule.data!
    })
  }, [stat, qLines.data, qProj.data, qTrends.data, qInj.data, qAlt.data, qSchedule.data])

  if (isLoading) return <div style={{padding:20}}>Loading…</div>
  if (isError)   return <div style={{padding:20}}>Failed to fetch data</div>

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {(['points','rebounds','assists','fg3PtMade','pointsReboundsAssists','pointsRebounds','pointsAssists','reboundsAssists','fantasyPts'] as StatKey[]).map(s => (
          <button key={s}
            onClick={() => setStat(s)}
            style={{
              padding: '6px 10px', borderRadius: 999, border: '1px solid #e5e7eb',
              background: s === stat ? '#111827' : '#fff',
              color: s === stat ? '#fff' : '#111',
              cursor: 'pointer'
            }}>
            {s}
          </button>
        ))}
      </div>
      <Table rows={rows} />
    </div>
  )
}

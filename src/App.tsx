import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Loading from './components/Loading'
import Table from './components/Table/Table'
import { getLines } from './api/lines'
import { getProjections } from './api/projections'
import { getTrends } from './api/trends'
import { getInjuries } from './api/injuries'
// alt lines intentionally not used anymore
import { getSchedule } from './api/schedule'
import { buildRows } from './lib/join'

export default function App() {
  const [stat] = useState<'points'>('points')

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
  if (error) return <div style={{ padding: 20, color: 'crimson' }}>Failed to fetch data: {String(error)}</div>

  // build rows from fetched data
  const rows = buildRows('points', {
    lines: qLines.data ?? [],
    projections: qProjections.data ?? [],
    trends: qTrends.data ?? [],
    injuries: qInjuries.data ?? [],
    alt: [], // intentionally empty: do not include alt-lines
    schedule: qSchedule.data ?? []
  })
  console.debug('[App] built rows', rows.length, rows.slice(0, 5))

  return (
    <div style={{ padding: 12 }}>
      <h2>Props table (stat: {stat})</h2>
      <Table rows={rows} />
    </div>
  )
}
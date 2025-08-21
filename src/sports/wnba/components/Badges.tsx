export function InjuryBadge({ status }: { status?: string | null }) {
  if (!status) return null
  const color = status === 'OUT' ? '#b42318' : status === 'GTD' ? '#a15c00' : '#475467'
  const bg = status === 'OUT' ? '#fee4e2' : status === 'GTD' ? '#fff4e5' : '#e4e7ec'
  return (
    <span style={{
      background: bg, color, borderRadius: 999, padding: '2px 8px',
      fontSize: 12, fontWeight: 600, marginLeft: 8
    }}>{status}</span>
  )
}

export function AltBadge({ show }: { show?: boolean }) {
  if (!show) return null
  return (
    <span style={{
      background: '#e0f2fe', color: '#075985', borderRadius: 999, padding: '2px 8px',
      fontSize: 12, fontWeight: 600, marginLeft: 8
    }}>ALT</span>
  )
}

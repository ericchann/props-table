import styles from './Table.module.css'
import type { TableRow } from '../../types/models'
import { InjuryBadge, AltBadge } from '../Badges'

type Props = { rows: TableRow[] }

function heatPercent(p?: number | null) {
  if (p == null) return {}
  const hue = Math.max(0, Math.min(100, p)) * 1.2 // 0..100 → 0..120
  return { backgroundColor: `hsl(${hue} 75% 92%)` } as React.CSSProperties
}

function heatDiff(d?: number | null) {
  if (d == null) return {}
  const clamped = Math.max(-5, Math.min(5, d))
  const pct = (clamped + 5) / 10 // 0..1
  const hue = pct * 120
  return { backgroundColor: `hsl(${hue} 75% 92%)` } as React.CSSProperties
}

function dvpPill(rank?: number | null) {
  if (rank == null) return '—'
  const label = rank === 1 ? '1st' : rank === 2 ? '2nd' : rank === 3 ? '3rd' : `${rank}th`
  const bg = rank <= 5 ? '#fde7e7' : '#eee'
  const color = rank <= 5 ? '#a11111' : '#444'
  return <span style={{ background: bg, color, borderRadius: 999, padding: '2px 8px', fontWeight: 600, fontSize: 12 }}>{label}</span>
}

export default function Table({ rows }: Props) {
  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.headerStickyLeft}>PLAYER</th>
            <th>L</th>
            <th>O</th>
            <th>U</th>
            <th>STK</th>
            <th>24/25</th>
            <th>H2H</th>
            <th>L5</th>
            <th>L10</th>
            <th>L20</th>
            <th>23/24</th>
            <th>PROJ</th>
            <th>DIFF</th>
            <th>DVP</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={`${r.id}-${r.stat}`}>
              <td className={styles.stickyCol}>
                <div>
                  {r.player} <span className={styles.smallText}>{r.team} | {r.position}</span>
                  <InjuryBadge status={r.inj} />
                  <AltBadge show={r.hasAlt} />
                </div>
              </td>
              <td className={styles.num}>{r.line ?? '—'}</td>
              <td className={styles.num}>{r.over ?? '—'}</td>
              <td className={styles.num}>{r.under ?? '—'}</td>
              <td className={styles.num}>{r.stk ?? 0}</td>

              <td className={styles.cell} style={heatPercent(r.pctSeason)}>{r.pctSeason ?? '—'}{r.pctSeason != null ? '%' : ''}</td>
              <td className={styles.cell} style={heatPercent(r.pctH2H)}>{r.pctH2H ?? '—'}{r.pctH2H != null ? '%' : ''}</td>
              <td className={styles.cell} style={heatPercent(r.pctL5)}>{r.pctL5 ?? '—'}{r.pctL5 != null ? '%' : ''}</td>
              <td className={styles.cell} style={heatPercent(r.pctL10)}>{r.pctL10 ?? '—'}{r.pctL10 != null ? '%' : ''}</td>
              <td className={styles.cell} style={heatPercent(r.pctL20)}>{r.pctL20 ?? '—'}{r.pctL20 != null ? '%' : ''}</td>
              <td className={styles.cell} style={heatPercent(r.pctPrev)}>{r.pctPrev ?? '—'}{r.pctPrev != null ? '%' : ''}</td>

              <td className={styles.num}>{r.proj?.toFixed(1) ?? '—'}</td>
              <td className={styles.cell} style={heatDiff(r.diff)}>{r.diff?.toFixed?.(1) ?? r.diff ?? '—'}</td>
              <td>{dvpPill(r.dvp)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

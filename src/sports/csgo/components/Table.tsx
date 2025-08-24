import styles from '../../wnba/components/Table.module.css'
import type { TableRow } from '../../../types/models'
import { InjuryBadge, AltBadge } from '../../wnba/components/Badges'
import React from 'react'

type Props = { rows: TableRow[] }

type SortDir = 'asc' | 'desc'
type ColKey =
  | 'PLAYER' | 'L' | 'O' | 'U' | 'STK'
  | '24/25' | 'H2H' | 'L5' | 'L10' | 'L20' | '23/24'
  | 'TIME'

export default function Table({ rows }: Props) {
  // Default sort to L5 descending for CSGO
  const [sortKey, setSortKey] = React.useState<ColKey>('L5')
  const [sortDir, setSortDir] = React.useState<SortDir>('desc')

  function heatPercent(p?: number | null): React.CSSProperties {
    if (p == null) return {}
    const pct = Math.max(0, Math.min(100, p))
    const hue = pct * 1.2
    const dist = Math.abs(pct - 50) / 50
    const sat = 58
    const light = 92 - dist * 12
    return { backgroundColor: `hsl(${hue} ${sat}% ${light}%)` }
  }

  // PROJ/DIFF/DVP removed for CSGO table; heatDiff/heatDvp not used

  const selectors: Record<ColKey, (r: TableRow) => string | number | null | undefined> = {
    PLAYER: (r) => r.player ?? '',
    L:      (r) => r.line,
    O:      (r) => r.over,
    U:      (r) => r.under,
    STK:    (r) => r.stk,
    '24/25':(r) => r.pctSeason,
    H2H:    (r) => r.pctH2H,
    L5:     (r) => r.pctL5,
    L10:    (r) => r.pctL10,
    L20:    (r) => r.pctL20,
    '23/24':(r) => r.pctPrev,
    TIME:   (r) => r.gameTime ?? ''
  }

  function cmp(a: unknown, b: unknown): number {
    const isNil = (v: unknown) => v == null || v === '\u2014'
    if (isNil(a) && isNil(b)) return 0
    if (isNil(a)) return 1
    if (isNil(b)) return -1
    const na = typeof a === 'number' ? a : Number(a)
    const nb = typeof b === 'number' ? b : Number(b)
    const bothNumeric = Number.isFinite(na) && Number.isFinite(nb)
    if (bothNumeric) return na === nb ? 0 : na < nb ? -1 : 1
    const sa = String(a).toLowerCase()
    const sb = String(b).toLowerCase()
    return sa.localeCompare(sb)
  }

  function sortRows(rowsIn: TableRow[]): TableRow[] {
    const val = selectors[sortKey]
    const sign = sortDir === 'asc' ? 1 : -1
    return rowsIn.map((r, i) => ({ r, i })).sort((x, y) => {
      const c = cmp(val(x.r), val(y.r))
      return c !== 0 ? sign * c : x.i - y.i
    }).map(x => x.r)
  }

  const sorted = React.useMemo(() => sortRows(rows), [rows, sortKey, sortDir])

  function handleSort(col: ColKey) {
    if (col === sortKey) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(col); setSortDir('asc') }
  }

  function ariaSort(col: ColKey): React.AriaAttributes['aria-sort'] {
    if (col !== sortKey) return 'none'
    return sortDir === 'asc' ? 'ascending' : 'descending'
  }

  const headers: { key: ColKey; label: string; sticky?: boolean }[] = [
    { key: 'PLAYER', label: 'PLAYER', sticky: true },
    { key: 'L', label: 'L' }, { key: 'O', label: 'O' }, { key: 'U', label: 'U' }, { key: 'STK', label: 'STK' },
    { key: '24/25', label: '2025' }, { key: 'H2H', label: 'VS Opp' }, { key: 'L5', label: 'L5' }, { key: 'L10', label: 'L10' },
    { key: 'L20', label: 'L20' }, { key: '23/24', label: '23/24' }, { key: 'TIME', label: 'TIME' }
  ]

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {headers.map(h => (
              <th key={h.key} className={`${h.sticky ? styles.headerStickyLeft : ''} ${styles.header}`} aria-sort={ariaSort(h.key)}>
                <button className={styles.headerButton} onClick={() => handleSort(h.key)} data-active={h.key === sortKey ? 'true' : 'false'} data-dir={sortDir} title={`Sort by ${h.label}`}>
                  <span>{h.label}</span>
                  <span className={styles.sortArrow} aria-hidden="true" />
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map(r => (
            <tr key={`${r.id}-${r.stat}`}>
              <td className={styles.stickyCol}>
                <div>
                  {r.player} <span className={styles.smallText}>{r.team} | {r.position}</span>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                    {(() => {
                      switch (r.stat) {
                        case 'map12Kills': return 'Map 1-2 Kills'
                        case 'map3Kills': return 'Map 3 Kills'
                        case 'map12Headshots': return 'Map 1-2 Headshots'
                        case 'map3Headshots': return 'Map 3 Headshots'
                        case 'map1Kills': return 'Map 1 Kills'
                        case 'map1Headshots': return 'Map 1 Headshots'
                        default: return ''
                      }
                    })()}
                  </div>
                  <InjuryBadge status={r.inj} />
                  <AltBadge show={r.hasAlt} />
                </div>
              </td>
              <td className={styles.num}>{r.line ?? '\u2014'}</td>
              <td className={styles.num}>{r.over ?? '\u2014'}</td>
              <td className={styles.num}>{r.under ?? '\u2014'}</td>
              <td className={styles.num}>{r.stk ?? 0}</td>
              <td className={styles.cell} style={heatPercent(r.pctSeason)}>{r.pctSeason ?? '\u2014'}{r.pctSeason != null ? '%' : ''}</td>
              <td className={styles.cell} style={heatPercent(r.pctH2H)}>{r.pctH2H ?? '\u2014'}{r.pctH2H != null ? '%' : ''}</td>
              <td className={styles.cell} style={heatPercent(r.pctL5)}>{r.pctL5 ?? '\u2014'}{r.pctL5 != null ? '%' : ''}</td>
              <td className={styles.cell} style={heatPercent(r.pctL10)}>{r.pctL10 ?? '\u2014'}{r.pctL10 != null ? '%' : ''}</td>
              <td className={styles.cell} style={heatPercent(r.pctL20)}>{r.pctL20 ?? '\u2014'}{r.pctL20 != null ? '%' : ''}</td>
              <td className={styles.cell} style={heatPercent(r.pctPrev)}>{r.pctPrev ?? '\u2014'}{r.pctPrev != null ? '%' : ''}</td>
              {/* PROJ, DIFF, and DVP columns removed for CSGO */}
              <td className={styles.cell}>{r.gameTime ?? '\u2014'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

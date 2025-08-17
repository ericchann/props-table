import axios from 'axios'

export type ApiStatKey = 'PTS' | 'TRB' | 'AST'
export type DvpPos = 'PG' | 'SG' | 'SF' | 'PF' | 'C'

export type DvpRankMap = {
  team: string
  // ranks[pos][apiStat] = rank number (1..N) or null
  ranks: Record<DvpPos, Partial<Record<ApiStatKey, number | null>>>
}

const POSITIONS: DvpPos[] = ['PG', 'SG', 'SF', 'PF', 'C']
const API_STATS: ApiStatKey[] = ['PTS', 'TRB', 'AST']

/**
 * Expected shape:
 * data.positional[PTS|TRB|AST][PG|SG|SF|PF|C].currentSeason -> [value, rank]
 */
export async function getDvp(team: string): Promise<DvpRankMap> {
  const url = `https://api.props.cash/wnba/def-vs-pos?team=${encodeURIComponent(team)}`
  const { data } = await axios.get(url, { timeout: 15000 })

  const positional = (data && (data as any).positional) || {}
  const ranks: DvpRankMap['ranks'] = {
    PG: {},
    SG: {},
    SF: {},
    PF: {},
    C: {},
  }

  for (const stat of API_STATS) {
    const byPos = positional?.[stat] || {}
    for (const pos of POSITIONS) {
      const currentSeason = byPos?.[pos]?.currentSeason
      const rank = Array.isArray(currentSeason) && currentSeason.length >= 2
        ? currentSeason[1]
        : null
      ;(ranks[pos] as any)[stat] = typeof rank === 'number' ? rank : null
    }
  }

  return { team, ranks }
}

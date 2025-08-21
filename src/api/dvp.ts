import axios from 'axios'

export type ApiStatKey = 'PTS' | 'TRB' | 'AST'
export type DvpPos = 'PG' | 'SG' | 'SF' | 'PF' | 'C'

export interface DvpRankMap {
  team: string
  ranks: Record<DvpPos, Record<ApiStatKey, number | null>>
}

const API_TOKEN = import.meta.env.VITE_API_TOKEN

function normalizePosKey(raw: string | undefined): DvpPos | null {
  if (!raw) return null
  const t = raw.toString().trim().toUpperCase()
  if (t === 'PG' || t === 'SG' || t === 'SF' || t === 'PF' || t === 'C') return t as DvpPos
  if (t === 'G' || t === 'GUARD') return 'PG'
  if (t === 'F' || t === 'FORWARD') return 'SF'
  if (t === 'CENTER') return 'C'
  // Some APIs send combined buckets; dump them into the first slot so we show something
  if (t === 'PG/SG') return 'PG'
  if (t === 'SF/PF') return 'SF'
  if (t === 'PF/C' || t === 'C/PF') return 'C'
  return null
}

export async function getDvp(team: string): Promise<DvpRankMap> {
  if (!API_TOKEN) throw new Error('Missing VITE_API_TOKEN in .env.local')

  const url = `https://api.props.cash/wnba/def-vs-pos?team=${team}`

  const res = await axios.get(url, {
    headers: { Authorization: `Bearer ${API_TOKEN}` },
  })
  const data = res.data

  const ranks: DvpRankMap['ranks'] = {
    PG: { PTS: null, TRB: null, AST: null },
    SG: { PTS: null, TRB: null, AST: null },
    SF: { PTS: null, TRB: null, AST: null },
    PF: { PTS: null, TRB: null, AST: null },
    C:  { PTS: null, TRB: null, AST: null },
  }

  // Based on the API response structure you showed, we need to parse the positional data
  if (data.positional) {
    for (const [stat, statData] of Object.entries(data.positional)) {
      for (const [pos, posData] of Object.entries(statData as any)) {
        const normPos = normalizePosKey(pos)
        if (!normPos) continue
        
        const currentSeason = (posData as any)?.currentSeason
        if (Array.isArray(currentSeason) && currentSeason.length >= 2) {
          // The rank is the second element of the currentSeason array
          const rank = currentSeason[1]
          if (typeof rank === 'number') {
            // Map the stat key to our API stat key format
            if (stat === 'PTS') ranks[normPos].PTS = rank
            else if (stat === 'AST') ranks[normPos].AST = rank
            else if (stat === 'TRB') ranks[normPos].TRB = rank
          }
        }
      }
    }
  }

  // IMPORTANT: return the normalized key we queried with so Map lookups work
  return { team, ranks }
}

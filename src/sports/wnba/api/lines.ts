import { z } from 'zod'
import { api } from './client'
import type { LinesRow } from '../../../types/models'

const L = z.object({
  // id may be null in some upstream responses — accept nullable then filter/normalize later
  id: z.string().nullable().optional(),
  name: z.string(), position: z.string(),
  team: z.string(), gameId: z.string(),
  // home/away may be missing for some entries
  homeTeam: z.string().optional(), awayTeam: z.string().optional(),
  gameStart: z.string(),
  // projection can contain extra keys not in STAT; accept any string keys
  projection: z.record(z.string(), z.any()).optional()
})
export async function getLines(): Promise<LinesRow[]> {
  const { data } = await api.get('/wnba/lines')
  try {
    const parsed = z.array(L).parse(data)

    const normalized = parsed.map((it) => {
      return {
        id: String(it.id ?? ''),
        name: it.name ?? '',
        position: it.position ?? '',
        team: it.team ?? '',
        gameId: String(it.gameId ?? ''),
        homeTeam: it.homeTeam,
        awayTeam: it.awayTeam,
        gameStart: it.gameStart ?? '',
        projection: (typeof it.projection === 'object' && it.projection !== null) ? it.projection : {}
      } as unknown as LinesRow
    })

    // expand per-player projection into one row per stat (points, assists, rebounds)
    const statsToShow = ['points', 'assists', 'rebounds']
    const rows = normalized.flatMap((p) => {
      // normalized players may have different name keys; ensure `name` exists for downstream joins
      const playerName = (p as any).name ?? (p as any).player ?? (p as any).fullName ?? ''
      const baseId = String((p as any).id ?? '')
      return statsToShow.map((stat) => {
        const projVal = (p as any).projection?.[stat]
        return {
          id: `${baseId}-${stat}`,
          baseId,
          name: playerName,
          player: playerName,
          team: p.team,
          stat,
          proj: typeof projVal === 'number' ? projVal : projVal == null ? null : Number(projVal),
          summary: (p as any).summary ?? null,
          projection: p.projection ?? {},
        } as unknown as LinesRow
      })
    })

    console.debug('[getLines] raw length:', Array.isArray(data) ? data.length : 0)
    console.debug('[getLines] normalized players:', normalized.length, 'expanded rows:', rows.length)
    return rows as unknown as LinesRow[]
  } catch (err) {
    console.warn('getLines: parse failed, returning empty array', err)
    return []
  }
}

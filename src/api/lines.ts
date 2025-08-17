import { z } from 'zod'
import { api } from './client'
import type { LinesRow } from '../types/models'

const STAT = z.enum([
  'points', 'rebounds', 'assists',
  'fg3PtMade', 'pointsReboundsAssists',
  'pointsRebounds', 'pointsAssists',
  'reboundsAssists', 'fantasyPts'
])

const LP = z.object({
  summary: z.object({
    manualOU: z.number().nullable(),
    overPrice: z.union([z.number(), z.string()]).nullable(),
    underPrice: z.union([z.number(), z.string()]).nullable(),
  }),
  altLines: z.record(z.string(), z.any()),
  books: z.array(z.object({
    book: z.string(),
    value: z.number().nullable().optional(),
    overPrice: z.union([z.number(), z.string()]).nullable().optional(),
    underPrice: z.union([z.number(), z.string()]).nullable().optional(),
  }))
})
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
  const { data } = await api.get('/lines')
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

    // DEBUG: inspect the fetched payload + how many normalized items
    console.debug('[getLines] raw length:', Array.isArray(data) ? data.length : 0)
    console.debug('[getLines] normalized length:', normalized.length, 'first:', normalized[0])

    return normalized
  } catch (err) {
    console.warn('getLines: parse failed, returning empty array', err)
    return []
  }
}

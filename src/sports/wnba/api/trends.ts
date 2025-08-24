import { z } from 'zod'
import { api } from './client'
import type { TrendsRow } from '../../../types/models'

const TB = z.object({
  line: z.number().nullable().optional(),
  rate: z.number().nullable().optional(),
  over: z.union([z.number(), z.string()]).nullable().optional(),
  under: z.union([z.number(), z.string()]).nullable().optional(),
  oppDef: z.number().nullable().optional(),
  l20Rate: z.union([z.number(), z.string()]).nullable().optional(),
  l10Rate: z.number().nullable().optional(),
  l5Rate: z.number().nullable().optional(),
  currentSeason: z.number().nullable().optional(),
  lastSeason: z.number().nullable().optional(),
  all: z.number().nullable().optional(),
  streak: z.number().nullable().optional(),
  l10Avg: z.number().nullable().optional(),
  vsOpp: z.number().nullable().optional(),
  vsOppGames: z.number().nullable().optional(),
})
const T = z.object({
  id: z.string(),
  name: z.string(),
  team: z.string(),
  position: z.string(),
  gameId: z.string(),
  points: TB.nullable().optional(),
  rebounds: TB.nullable().optional(),
  assists: TB.nullable().optional(),
  fg3PtMade: TB.nullable().optional(),
  pointsReboundsAssists: TB.nullable().optional(),
  pointsRebounds: TB.nullable().optional(),
  pointsAssists: TB.nullable().optional(),
  reboundsAssists: TB.nullable().optional(),
  fantasyPts: TB.nullable().optional(),
})
export async function getTrends(): Promise<TrendsRow[]> {
  try {
  const { data } = await api.get('/wnba/prop-trends')
    const parsed = z.array(T).parse(data) // trends columns ✓
    return parsed
  } catch (err) {
    console.warn('getTrends: parse failed, returning empty array', err)
    return []
  }
}

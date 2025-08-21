import { z } from 'zod'
import { api } from './client'
import type { AltLinesRow } from '../../../types/models'

const A = z.object({
  prop: z.enum([
    'points',
    'rebounds',
    'assists',
    'fg3PtMade',
    'pointsReboundsAssists',
    'pointsRebounds',
    'pointsAssists',
    'reboundsAssists',
    'fantasyPts'
  ]),
  player: z.string(),
  team: z.string(),
  opponent: z.string(),
  id: z.string(),
  gameId: z.string(),
  markets: z.array(z.tuple([z.number(), z.number()]))
})
export async function getAltLines(): Promise<AltLinesRow[]> {
  try {
    const { data } = await api.get('/alt-lines')
    const parsed = z.array(A).parse(data)
    return parsed
  } catch (err) {
    console.warn('getAltLines: parse failed, returning empty array', err)
    return []
  }
}

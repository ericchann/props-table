import { z } from 'zod'
import { api } from './client'
import type { AltLinesRow } from '../types/models'

const A = z.object({
  prop: z.string(),
  player: z.string(),
  team: z.string(),
  opponent: z.string(),
  id: z.string(),
  gameId: z.string(),
  markets: z.array(z.tuple([z.number(), z.number()]))
})
export async function getAltLines(): Promise<AltLinesRow[]> {
  const { data } = await api.get('/alt-lines')
  return z.array(A).parse(data) // alt-lines markets ✔  :contentReference[oaicite:18]{index=18}
}

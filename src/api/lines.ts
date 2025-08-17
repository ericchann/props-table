import { z } from 'zod'
import { api } from './client'
import type { LinesRow } from '../types/models'

const LP = z.object({
  summary: z.object({
    manualOU: z.number().nullable(),
    overPrice: z.union([z.number(), z.string()]).nullable(),
    underPrice: z.union([z.number(), z.string()]).nullable(),
  }),
  altLines: z.record(z.any()),
  books: z.array(z.object({
    book: z.string(),
    value: z.number().nullable().optional(),
    overPrice: z.union([z.number(), z.string()]).nullable().optional(),
    underPrice: z.union([z.number(), z.string()]).nullable().optional(),
  }))
})
const L = z.object({
  id: z.string(), name: z.string(), position: z.string(),
  team: z.string(), gameId: z.string(),
  homeTeam: z.string(), awayTeam: z.string(),
  gameStart: z.string(),
  projection: z.record(LP.or(z.any()))
})
export async function getLines(): Promise<LinesRow[]> {
  const { data } = await api.get('/lines')
  return z.array(L).parse(data) // lines summary + books ✔  :contentReference[oaicite:21]{index=21}
}

import { z } from 'zod'
import { api } from './client'
import type { ProjectionsRow } from '../types/models'

const P = z.object({
  id: z.string(),
  name: z.string(),
  team: z.string(),
  gameId: z.string(),
  lines: z.record(z.any()),
  projections: z.record(z.any())
})
export async function getProjections(): Promise<ProjectionsRow[]> {
  const { data } = await api.get('/projections')
  return z.array(P).parse(data) // projections shape ✔  :contentReference[oaicite:19]{index=19}
}

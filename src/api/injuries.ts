import { z } from 'zod'
import { api } from './client'
import type { InjuryRow } from '../types/models'

const I = z.object({
  id: z.string(), name: z.string(), team: z.string(),
  position: z.string(), status: z.string(), isOut: z.boolean()
})
export async function getInjuries(): Promise<InjuryRow[]> {
  const { data } = await api.get('/injuries')
  return z.array(I).parse(data) // injuries shape ✔  :contentReference[oaicite:17]{index=17}
}

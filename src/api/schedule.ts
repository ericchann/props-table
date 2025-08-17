import { z } from 'zod'
import { api } from './client'
import type { ScheduleGame } from '../types/models'

const S = z.object({
  id: z.string(), date: z.string(), time: z.string(),
  home: z.string(), away: z.string()
})
export async function getSchedule(): Promise<ScheduleGame[]> {
  try {
    const { data } = await api.get('/schedule')
    const parsed = z.array(S).parse(data) // schedule shape  ✔  :contentReference[oaicite:16]{index=16}
    return parsed
  } catch (err) {
    console.warn('getSchedule: parse failed, returning empty array', err)
    return []
  }
}

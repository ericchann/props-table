import { api } from './client'
import type { ProjectionsRow } from '../types/models'

export async function getProjections(): Promise<ProjectionsRow[]> {
  try {
    const res = await api.get('/projections')
    const raw = Array.isArray(res.data) ? res.data : []

    const normalized: ProjectionsRow[] = raw.map((r: any) => {
      return {
        id: String(r?.id ?? ''),                 // coerce null -> ''
        name: r?.name ?? '',
        team: r?.team ?? '',
        gameId: String(r?.gameId ?? ''),
        // ensure lines/projections are objects; API sometimes uses "projection" or "projections"
        lines: typeof r?.lines === 'object' && r.lines !== null ? r.lines : {},
        projections: typeof r?.projections === 'object' && r.projections !== null
          ? r.projections
          : (typeof r?.projection === 'object' && r.projection !== null ? r.projection : {})
      }
    })

    return normalized
  } catch (err) {
    console.warn('getProjections: fetch/normalize failed, returning empty array', err)
    return []
  }
}

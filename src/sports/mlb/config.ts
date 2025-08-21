export const label = 'MLB'

export function normalizeTeam(raw?: string | null): string | null {
  if (!raw) return null
  return raw.toString().trim().toUpperCase().slice(0,3)
}

export const sport = 'mlb'

export const label = 'CSGO'

// CSGO doesn't use team abbreviations like team sports; return the team string as-is
export function normalizeTeam(raw?: string | null): string | null {
  if (!raw) return null
  return raw.toString().trim()
}

export const sport = 'csgo'

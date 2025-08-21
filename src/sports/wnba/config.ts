export const label = 'WNBA'

export const TEAM_ALIASES: Record<string, string> = {
  ATL: 'ATL', CHI: 'CHI', CON: 'CON', DAL: 'DAL', IND: 'IND',
  LAS: 'LAS', LVA: 'LVA', MIN: 'MIN', NYL: 'NYL', PHX: 'PHX',
  SEA: 'SEA', WAS: 'WAS', GSV: 'GSV',
  NY: 'NYL', NYC: 'NYL', LIBERTY: 'NYL', 'NEW YORK': 'NYL', 'NEW YORK LIBERTY': 'NYL',
  LV: 'LVA', 'LAS VEGAS': 'LVA', 'LAS VEGAS ACES': 'LVA', ACES: 'LVA',
  LA: 'LAS', 'LOS ANGELES': 'LAS', 'LOS ANGELES SPARKS': 'LAS', SPARKS: 'LAS',
  PHO: 'PHX', PHOENIX: 'PHX', 'PHOENIX MERCURY': 'PHX', MERCURY: 'PHX',
  CONN: 'CON', CONNECTICUT: 'CON', 'CONNECTICUT SUN': 'CON', SUN: 'CON',
  CHICAGO: 'CHI', 'CHICAGO SKY': 'CHI', SKY: 'CHI',
  ATLANTA: 'ATL', 'ATLANTA DREAM': 'ATL', DREAM: 'ATL',
  DALLAS: 'DAL', 'DALLAS WINGS': 'DAL', WINGS: 'DAL',
  INDIANA: 'IND', 'INDIANA FEVER': 'IND', FEVER: 'IND',
  MINNESOTA: 'MIN', 'MINNESOTA LYNX': 'MIN', LYNX: 'MIN',
  SEATTLE: 'SEA', 'SEATTLE STORM': 'SEA', STORM: 'SEA',
  WASHINGTON: 'WAS', 'WASHINGTON MYSTICS': 'WAS', MYSTICS: 'WAS',
}

export function normalizeTeam(raw?: string | null): string | null {
  if (!raw) return null
  const t = raw.toString().trim().toUpperCase().replace(/\./g, '').replace(/\s+/g, ' ')
  if (TEAM_ALIASES[t]) return TEAM_ALIASES[t]
  const first3 = t.slice(0, 3)
  if (TEAM_ALIASES[first3]) return TEAM_ALIASES[first3]
  if (t === 'NY') return 'NYL'
  if (t === 'LV') return 'LVA'
  if (t === 'LA') return 'LAS'
  return null
}

export const sport = 'wnba'

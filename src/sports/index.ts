export type SportId = 'wnba' | 'nba' | 'mlb' | 'csgo'

import * as wnba from './wnba/config'
import * as mlb from './mlb/config'
import * as csgo from './csgo/config'

export const SUPPORTED_SPORTS: SportId[] = ['wnba', 'mlb', 'csgo']

export const SPORT_META: Record<SportId, { label: string }> = {
  wnba: { label: 'WNBA' },
  nba: { label: 'NBA' },
  mlb: { label: 'MLB' },
  csgo: { label: 'CSGO' },
}

export function isSupportedSport(s?: string | null): s is SportId {
  if (!s) return false
  return (SUPPORTED_SPORTS as string[]).includes(s)
}

export function getSportConfig(s: SportId) {
  switch (s) {
    case 'wnba': return wnba
    case 'mlb': return mlb
    case 'csgo': return csgo
    default: return wnba
  }
}

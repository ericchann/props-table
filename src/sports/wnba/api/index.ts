import * as lines from './lines'
import * as projections from './projections'
import * as trends from './trends'
import * as injuries from './injuries'
import * as schedule from './schedule'
import * as dvp from './dvp'

import type { SportId } from '../../../sports'

export function getLines(_sport: SportId = 'wnba') {
  return lines.getLines()
}

export function getProjections(_sport: SportId = 'wnba') {
  return projections.getProjections()
}

export function getTrends(_sport: SportId = 'wnba') {
  return trends.getTrends()
}

export function getInjuries(_sport: SportId = 'wnba') {
  return injuries.getInjuries()
}

export function getSchedule(_sport: SportId = 'wnba') {
  return schedule.getSchedule()
}

export function getDvp(team: string, _sport: SportId = 'wnba') {
  return dvp.getDvp(team)
}
